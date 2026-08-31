
const HEADERS={
  'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'accept':'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'accept-language':'en-US,en;q=0.9'
};

async function fetchText(url,ms=6500){
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),ms);
  try{
    const r=await fetch(url,{headers:HEADERS,redirect:'follow',cache:'no-store',signal:ctl.signal});
    if(!r.ok) throw new Error(`${r.status}`);
    return await r.text();
  }finally{clearTimeout(timer)}
}

function clean(s=''){return String(s||'').replace(/\s+/g,' ').trim()}
function firstStoreFromHtml(html,store){
  // Best-effort extraction from public store-locator/search responses.
  const text=clean(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '));
  const patterns = store==='Walmart'
    ? [/Walmart Supercenter[^0-9]{0,90}(\d{1,6}\s+[^,]{3,70},\s*[^,]{2,40},\s*[A-Z]{2}\s*\d{5})/i,
       /Walmart Neighborhood Market[^0-9]{0,90}(\d{1,6}\s+[^,]{3,70},\s*[^,]{2,40},\s*[A-Z]{2}\s*\d{5})/i]
    : [/Dollar General[^0-9]{0,90}(\d{1,6}\s+[^,]{3,70},\s*[^,]{2,40},\s*[A-Z]{2}\s*\d{5})/i];
  for(const p of patterns){
    const m=text.match(p);
    if(m) return {name:store,address:clean(m[1]),verified:false};
  }
  return null;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  const zip=String(req.query.zip||'').replace(/\D/g,'').slice(0,5);
  if(zip.length!==5) return res.status(400).json({error:'Enter a 5-digit ZIP code'});

  const results={zip,stores:{}};

  // Kroger location is resolved separately in the browser with the connected Kroger API,
  // but we return a placeholder here so the UI can combine all three stores.
  results.stores.kroger={name:'Kroger',address:'Finding nearest connected Kroger location…',verified:false};

  const dgUrl=`https://www.dollargeneral.com/store-directory?search=${encodeURIComponent(zip)}`;
  const wmUrl=`https://www.walmart.com/store/finder?location=${encodeURIComponent(zip)}`;

  const [dg,wm]=await Promise.allSettled([
    fetchText(dgUrl),
    fetchText(wmUrl)
  ]);

  if(dg.status==='fulfilled'){
    results.stores.dg=firstStoreFromHtml(dg.value,'Dollar General') || {
      name:'Dollar General',address:`Nearest store for ${zip}`,verified:false,locatorUrl:dgUrl
    };
  }else{
    results.stores.dg={name:'Dollar General',address:`Nearest store for ${zip}`,verified:false,locatorUrl:dgUrl};
  }

  if(wm.status==='fulfilled'){
    results.stores.walmart=firstStoreFromHtml(wm.value,'Walmart') || {
      name:'Walmart',address:`Nearest store for ${zip}`,verified:false,locatorUrl:wmUrl
    };
  }else{
    results.stores.walmart={name:'Walmart',address:`Nearest store for ${zip}`,verified:false,locatorUrl:wmUrl};
  }

  return res.status(200).json(results);
}
