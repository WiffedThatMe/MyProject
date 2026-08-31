
function haversine(lat1,lon1,lat2,lon2){
  const R=3958.7613, rad=Math.PI/180;
  const dLat=(lat2-lat1)*rad,dLon=(lon2-lon1)*rad;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
function address(tags={}){
  const line=[
    [tags['addr:housenumber'],tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:city']||tags['addr:town']||tags['addr:village'],
    tags['addr:state'],
    tags['addr:postcode']
  ].filter(Boolean);
  return line.join(', ');
}
function point(e){
  if(Number.isFinite(e.lat)&&Number.isFinite(e.lon)) return [e.lat,e.lon];
  if(e.center&&Number.isFinite(e.center.lat)&&Number.isFinite(e.center.lon)) return [e.center.lat,e.center.lon];
  return null;
}
function matchStore(tags={},kind){
  const hay=[tags.name,tags.brand,tags.operator,tags['brand:wikidata']].filter(Boolean).join(' ').toLowerCase();
  if(kind==='dg') return hay.includes('dollar general');
  if(kind==='walmart') return hay.includes('walmart') || hay.includes('wal-mart');
  return false;
}
function best(elements,kind,lat,lon){
  return elements.map(e=>{
    const p=point(e); if(!p||!matchStore(e.tags||{},kind)) return null;
    const d=haversine(lat,lon,p[0],p[1]);
    return {
      name:(e.tags||{}).name || (kind==='dg'?'Dollar General':'Walmart'),
      address:address(e.tags||{}),
      lat:p[0],lon:p[1],distanceMiles:Math.round(d*10)/10,
      source:'OpenStreetMap'
    };
  }).filter(Boolean).sort((a,b)=>a.distanceMiles-b.distanceMiles)[0]||null;
}
async function overpass(lat,lon,radiusMeters){
  const q=`[out:json][timeout:12];
  (
    nwr(around:${radiusMeters},${lat},${lon})["shop"]["name"~"Dollar General|Walmart|Wal-Mart",i];
    nwr(around:${radiusMeters},${lat},${lon})["brand"~"Dollar General|Walmart|Wal-Mart",i];
    nwr(around:${radiusMeters},${lat},${lon})["operator"~"Dollar General|Walmart|Wal-Mart",i];
  );
  out center tags;`;
  const urls=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let lastErr;
  for(const url of urls){
    const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),14000);
    try{
      const r=await fetch(url,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'CouponGamePlan/1.0'},body:'data='+encodeURIComponent(q),signal:ctl.signal,cache:'no-store'});
      if(!r.ok) throw new Error(`Map service ${r.status}`);
      return await r.json();
    }catch(e){lastErr=e}finally{clearTimeout(timer)}
  }
  throw lastErr||new Error('Map service unavailable');
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  const lat=Number(req.query.lat),lon=Number(req.query.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180){
    return res.status(400).json({error:'Valid latitude and longitude are required'});
  }
  try{
    let data=await overpass(lat,lon,40000);
    let dg=best(data.elements||[],'dg',lat,lon), walmart=best(data.elements||[],'walmart',lat,lon);
    if(!dg||!walmart){
      data=await overpass(lat,lon,80000);
      dg=dg||best(data.elements||[],'dg',lat,lon);
      walmart=walmart||best(data.elements||[],'walmart',lat,lon);
    }
    res.status(200).json({lat,lon,stores:{dg,walmart},source:'OpenStreetMap'});
  }catch(e){
    res.status(200).json({lat,lon,stores:{dg:null,walmart:null},source:'OpenStreetMap',warning:e.message||'Nearby store lookup unavailable'});
  }
}
