
const DG_COUPONS='https://www.dollargeneral.com/deals/weekly-ads/weekly-ad/1057490/coupons?sort=0&sortOrder=2&type=0';
const WALMART_PAGES=[
  ['Food','https://www.walmart.com/search?q=great+value+snacks'],
  ['Drinks','https://www.walmart.com/search?q=great+value+water'],
  ['Laundry','https://www.walmart.com/search?q=laundry+detergent'],
  ['Cleaning','https://www.walmart.com/search?q=cleaning+supplies']
];
const KROGER_PAGES=[
  ['Food','https://www.kroger.com/search?query=pasta'],
  ['Food','https://www.kroger.com/search?query=eggs'],
  ['Drinks','https://www.kroger.com/search?query=water'],
  ['Laundry','https://www.kroger.com/search?query=laundry%20detergent'],
  ['Cleaning','https://www.kroger.com/search?query=cleaning%20supplies']
];

const HEADERS={
  'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'accept':'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'accept-language':'en-US,en;q=0.9'
};

async function fetchText(url,ms=7000){
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),ms);
  try{
    const r=await fetch(url,{headers:HEADERS,redirect:'follow',cache:'no-store',signal:ctl.signal});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.text();
  } finally { clearTimeout(timer); }
}
function decode(s=''){
  return s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&nbsp;',' ');
}
function plain(html=''){
  return decode(
    html
      .replace(new RegExp('<script[\\s\\S]*?<\\/script>','gi'),' ')
      .replace(new RegExp('<style[\\s\\S]*?<\\/style>','gi'),' ')
      .replace(new RegExp('<[^>]+>','g'),' ')
      .replace(new RegExp('\\s+','g'),' ')
  ).trim();
}
function clean(s=''){ return String(s||'').replace(new RegExp('\\s+','g'),' ').trim(); }
function num(v){ const n=Number(String(v||'').replace(/[$,]/g,'')); return Number.isFinite(n)?n:null; }
function usDate(m,d,y){
  const yy=Number(y)<100?2000+Number(y):Number(y);
  return `${yy}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function source(label,ok,count=0,message=''){ return {label,ok,count,message}; }

function parseDG(html){
  const text=plain(html);
  const out=[];
  const chunks=text.split(/Digital Coupon|Cash Back/i).slice(1);
  for(const raw of chunks.slice(0,500)){
    const block=clean(raw.slice(0,600));
    const amountMatch=block.match(/(?:Save|Earn)\s*\$([0-9]+(?:\.[0-9]{1,2})?)/i);
    const dateMatch=block.match(/(?:EXP\s*)?(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{2,4})/i);
    const bogo=/Buy One, Get One|BOGO/i.test(block);
    if(!amountMatch && !bogo) continue;
    let title=clean(block.split(/Save|Earn|Buy One, Get One|BOGO/i)[0]).slice(0,100);
    if(!title) title='Dollar General offer';
    out.push({
      store:'DG',
      type:bogo?'Promotion':'Digital Coupon',
      title,
      amount:amountMatch?Number(amountMatch[1]):0,
      bogo,
      details:block.slice(0,360),
      couponEnd:dateMatch?usDate(dateMatch[1],dateMatch[2],dateMatch[3]):null,
      sourceUrl:DG_COUPONS
    });
  }
  return out.filter((x,i,a)=>a.findIndex(y=>y.title===x.title&&y.amount===x.amount&&y.couponEnd===x.couponEnd)===i);
}

function jsonLdProducts(html,store,cat,sourceUrl){
  const out=[];
  const rx=new RegExp('<script[^>]*type=["\\\']application/ld\\+json["\\\'][^>]*>([\\s\\S]*?)<\\/script>','gi');
  let m;
  while((m=rx.exec(html)) && out.length<250){
    try{
      const root=JSON.parse(decode(m[1]));
      const walk=x=>{
        if(!x) return;
        if(Array.isArray(x)){ x.forEach(walk); return; }
        if(typeof x!=='object') return;
        const offer=Array.isArray(x.offers)?x.offers[0]:x.offers;
        const price=num(offer?.price ?? offer?.lowPrice ?? x.price);
        if(x.name && price && price<1000){
          out.push({store,name:clean(x.name).slice(0,140),cat,price,sale:price,coupon:0,ibotta:0,fetch:0,sourceUrl,live:true});
        }
        Object.values(x).forEach(walk);
      };
      walk(root);
    }catch{}
  }
  return out;
}

function parseWalmart(html,cat,url){
  const out=jsonLdProducts(html,'Walmart',cat,url);
  const text=plain(html);
  if(out.length<3){
    const rx=/\$([0-9]+(?:\.[0-9]{1,2})?)\s+([A-Z][A-Za-z0-9®™'’&+.,()\- /]{6,110})/g;
    let m;
    while((m=rx.exec(text)) && out.length<150){
      const price=num(m[1]), name=clean(m[2]);
      if(price && name && !/shipping|delivery|returns/i.test(name)){
        out.push({store:'Walmart',name,cat,price,sale:price,coupon:0,ibotta:0,fetch:0,sourceUrl:url,live:true});
      }
    }
  }
  return out;
}

function parseKroger(html,cat,url){
  const products=jsonLdProducts(html,'Kroger',cat,url);
  const promos=[];
  const text=plain(html);
  const priceRx=/\$([0-9]+(?:\.[0-9]{1,2})?)\s+(?:Discounted From\s+\$([0-9]+(?:\.[0-9]{1,2})?)\s+)?([A-Z][A-Za-z0-9®™'’&+.,()\- /]{4,100})/g;
  let m;
  while((m=priceRx.exec(text)) && products.length<200){
    const sale=num(m[1]), regular=num(m[2])||sale, name=clean(m[3]);
    if(sale && name){
      products.push({store:'Kroger',name,cat,price:regular,sale,coupon:0,ibotta:0,fetch:0,sourceUrl:url,live:true});
    }
  }
  const promoRx=/(Pay [^.!?]{3,90}|Save \$?[0-9][^.!?]{2,90}|Buy [^.!?]{3,90})[^A-Za-z]{0,15}(Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\.?\s+(\d{1,2})/gi;
  const months={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
  while((m=promoRx.exec(text)) && promos.length<100){
    const mon=m[2].slice(0,3), yr=new Date().getFullYear();
    promos.push({store:'Kroger',type:'Promotion',title:clean(m[1]),amount:0,details:clean(m[1]),couponEnd:`${yr}-${String(months[mon]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`,sourceUrl:url});
  }
  return {products,promos};
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  const zip=String(req.query.zip||'').replace(/\D/g,'').slice(0,5);
  const products=[], promotions=[];
  const sources={};

  const jobs=[
    (async()=>{
      try{
        const html=await fetchText(DG_COUPONS);
        const rows=parseDG(html);
        promotions.push(...rows);
        sources.dg=source('Dollar General coupons',rows.length>0,rows.length,rows.length?'Official DG coupon page answered':'DG page answered but no readable coupons were found');
      }catch(e){ sources.dg=source('Dollar General coupons',false,0,e.message); }
    })(),
    ...WALMART_PAGES.map(async([cat,url])=>{
      try{ return parseWalmart(await fetchText(url),cat,url); }catch{return[];}
    }),
    ...KROGER_PAGES.map(async([cat,url])=>{
      try{ return parseKroger(await fetchText(url),cat,url); }catch{return {products:[],promos:[]};}
    })
  ];

  const settled=await Promise.all(jobs);
  const walmartResults=settled.slice(1,1+WALMART_PAGES.length).flat();
  products.push(...walmartResults);
  sources.walmart=source('Walmart public prices',walmartResults.length>0,walmartResults.length,walmartResults.length?'Public Walmart pages answered':'No readable Walmart prices on this refresh');

  const krogerResults=settled.slice(1+WALMART_PAGES.length);
  const krogerProducts=krogerResults.flatMap(x=>x.products||[]);
  const krogerPromos=krogerResults.flatMap(x=>x.promos||[]);
  products.push(...krogerProducts); promotions.push(...krogerPromos);
  sources.kroger=source('Kroger public prices & promos',krogerProducts.length>0,krogerProducts.length+krogerPromos.length,krogerProducts.length?'Public Kroger pages answered':'No readable Kroger prices on this refresh');

  sources.ibotta=source('Ibotta',false,0,'Account/location-specific; not verified from public web pages');
  sources.fetch=source('Fetch',false,0,'Account/location-specific; not verified from public web pages');

  const dedupedProducts=products.filter((x,i,a)=>a.findIndex(y=>y.store===x.store&&y.name.toLowerCase()===x.name.toLowerCase()&&Math.abs((y.sale||0)-(x.sale||0))<0.001)===i).slice(0,700);
  const dedupedPromos=promotions.filter((x,i,a)=>a.findIndex(y=>y.store===x.store&&y.title.toLowerCase()===x.title.toLowerCase()&&y.couponEnd===x.couponEnd)===i).slice(0,700);
  const live=Object.values(sources).some(s=>s.ok);

  res.status(200).json({
    live,
    updatedAt:new Date().toISOString(),
    products:dedupedProducts,
    promotions:dedupedPromos,
    sources,
    zip:zip||null,
    coverageNote:'Best-effort public website data for the selected ZIP area. Exact prices can still vary by store, loyalty account, pickup/delivery mode, and app-only offers.'
  });
}
