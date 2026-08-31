const DG_COUPONS = 'https://www.dollargeneral.com/deals/weekly-ads/weekly-ad/1057490/coupons?sort=0&sortOrder=2&type=0';
const WALMART_PAGES = [
  ['Drinks','https://www.walmart.com/browse/food/great-value/water/976759/YnJhbmQ6R3JlYXQgVmFsdWV8fGNhdGVnb3J5OldhdGVy'],
  ['Food','https://www.walmart.com/search?q=great+value+snacks'],
  ['Laundry','https://www.walmart.com/search?q=laundry+detergent'],
  ['Cleaning','https://www.walmart.com/search?q=cleaning+supplies']
];
const KROGER_PAGES = [
  ['Food','https://www.kroger.com/q/grocery'],
  ['Food','https://www.kroger.com/q/snacks'],
  ['Drinks','https://www.kroger.com/q/beverages'],
  ['Laundry','https://www.kroger.com/q/laundry'],
  ['Cleaning','https://www.kroger.com/q/cleaning']
];

const HEADERS = {
  'user-agent':'Mozilla/5.0 (compatible; CouponGamePlan/1.0; +https://vercel.app)',
  'accept':'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'accept-language':'en-US,en;q=0.9'
};

function htmlDecode(s='') { return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&reg;/g,'®').replace(/&trade;/g,'™'); }
function textOnly(html='') { return htmlDecode(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()); }
function cleanName(s='') { return s.replace(/\s+/g,' ').replace(/^[-–—|: ]+|[-–—|: ]+$/g,'').trim(); }
function moneyNum(v) { const n=Number(String(v||'').replace(/[$,]/g,'')); return Number.isFinite(n)?n:null; }
function isoFromUS(m,d,y) { const yy=Number(y)<100?2000+Number(y):Number(y); return `${yy}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

async function fetchText(url, ms=9000) {
  const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),ms);
  try {
    const r=await fetch(url,{headers:HEADERS,redirect:'follow',cache:'no-store',signal:ctl.signal});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.text();
  } finally { clearTimeout(t); }
}

function parseDG(html) {
  const text=textOnly(html);
  const out=[];
  const re=/(Digital Coupon|Cash Back)\\s+(?:Image: Coupon for )?([\\s\\S]{2,220}?)(?=(?:Digital Coupon|Cash Back|\\[Button: Load more\\]|About DG|$))/g;
  let m;
  while((m=re.exec(text)) && out.length<500) {
    const type=m[1]; const block=cleanName(m[2]);
    const amt=block.match(/(?:Save|SAVE|Earn)\\s*\\$([0-9]+(?:\\.[0-9]{1,2})?)/i);
    const bogo=/Buy One, Get One|BOGO/i.test(block);
    const date=block.match(/(?:EXP\\s*)?(0?[1-9]|1[0-2])\\/(0?[1-9]|[12]\\d|3[01])\\/(\\d{2,4})/i);
    const sourceType=/Cash Back/i.test(type)?'Cash Back':'Digital Coupon';
    let title=block.split(/(?:Save|SAVE|Earn|Buy One, Get One)/i)[0].trim();
    if(!title || title.length>90) title='Dollar General offer';
    const details=block.slice(0,360);
    out.push({store:'DG',type:sourceType,title,amount:amt?Number(amt[1]):0,bogo,details,couponEnd:date?isoFromUS(date[1],date[2],date[3]):null,sourceUrl:DG_COUPONS});
  }
  // Fallback parser for the server-rendered text seen on DG's public page.
  if(!out.length) {
    const blocks=text.split(/Digital Coupon|Cash Back/).slice(1);
    for(const raw of blocks.slice(0,500)) {
      const block=cleanName(raw.slice(0,500)); if(!block) continue;
      const amt=block.match(/(?:Save|SAVE|Earn)\\s*\\$([0-9]+(?:\\.[0-9]{1,2})?)/i);
      const date=block.match(/(?:EXP\\s*)?(0?[1-9]|1[0-2])\\/(0?[1-9]|[12]\\d|3[01])\\/(\\d{2,4})/i);
      const title=cleanName(block.split(/(?:Save|SAVE|Earn|Buy One, Get One)/i)[0]).slice(0,90) || 'Dollar General offer';
      if(amt || /Buy One, Get One|BOGO/i.test(block)) out.push({store:'DG',type:'Offer',title,amount:amt?Number(amt[1]):0,bogo:/Buy One, Get One|BOGO/i.test(block),details:block.slice(0,360),couponEnd:date?isoFromUS(date[1],date[2],date[3]):null,sourceUrl:DG_COUPONS});
    }
  }
  return out.filter((x,i,a)=>a.findIndex(y=>y.title===x.title&&y.amount===x.amount&&y.couponEnd===x.couponEnd)===i);
}

function collectJsonProducts(html, store, cat, sourceUrl) {
  const products=[]; const scripts=[...html.matchAll(/<script[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)].map(m=>m[1]);
  for(const raw of scripts) {
    try {
      const root=JSON.parse(htmlDecode(raw));
      const walk=(x)=>{
        if(!x) return;
        if(Array.isArray(x)) return x.forEach(walk);
        if(typeof x!=='object') return;
        const offer=Array.isArray(x.offers)?x.offers[0]:x.offers;
        const price=moneyNum(offer?.price ?? offer?.lowPrice ?? x.price);
        if(x.name && price!=null && price>0 && price<1000) products.push({store,name:cleanName(x.name).slice(0,140),cat,price,sale:price,coupon:0,ibotta:0,fetch:0,sourceUrl,live:true});
        Object.values(x).forEach(walk);
      }; walk(root);
    } catch {}
  }
  return products;
}

function parseWalmart(html, cat, url) {
  let p=collectJsonProducts(html,'Walmart',cat,url);
  const text=textOnly(html);
  if(p.length<3) {
    const re=/(?:current price )?\\$([0-9]+(?:\\.[0-9]{1,2})?)\\s+(?:[0-9.]+\\s*¢\\/[^ ]+\\s+)?([A-Z][^$]{8,120}?)(?=\\s+(?:[0-9.]+ out of 5|SNAP|Add|Save with|current price|\\$))/g;
    let m; while((m=re.exec(text))&&p.length<150){ const price=moneyNum(m[1]); const name=cleanName(m[2]); if(price&&name&&!/returns|delivery|shipping/i.test(name)) p.push({store:'Walmart',name,cat,price,sale:price,coupon:0,ibotta:0,fetch:0,sourceUrl:url,live:true}); }
  }
  return p;
}

function parseKroger(html, cat, url) {
  let products=collectJsonProducts(html,'Kroger',cat,url); const promos=[]; const text=textOnly(html);
  // Kroger public result pages often render price immediately before the product name.
  const re=/\\$([0-9]+(?:\\.[0-9]{1,2})?)\\s+(?:Discounted From\\s+\\$([0-9]+(?:\\.[0-9]{1,2})?)\\s+)?(?:\\$[0-9.]+\\/(?:oz|each|fl oz)\\s+)?([A-Z][A-Za-z0-9®™'’&+.,()\\- \\/]{4,120}?)(?=\\s+(?:\\d+(?:\\.\\d+)?\\s*(?:oz|ct|gal|ounces|sticks)|SNAP EBT|Low Stock|\\[Button|Pay |Save ))/g;
  let m; while((m=re.exec(text))&&products.length<250){ const sale=moneyNum(m[1]); const regular=moneyNum(m[2])||sale; const name=cleanName(m[3]); if(sale&&name) products.push({store:'Kroger',name,cat,price:regular,sale,coupon:0,ibotta:0,fetch:0,sourceUrl:url,live:true}); }
  const pr=/(Pay [^.!?]{3,100}|Save \\$?[0-9][^.!?]{2,100}|Buy [^.!?]{3,100})\\s+(?:View Offer\\s+)?(?:Available Offers\\s+)?(?:Sale\\s+)?(?:Image:[^#]{0,150})?(?:Exp\\.\\s*)?(Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\\.?\\s+(\\d{1,2})/gi;
  const months={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
  while((m=pr.exec(text))&&promos.length<100){ const yr=new Date().getFullYear(); promos.push({store:'Kroger',type:'Promotion',title:cleanName(m[1]).slice(0,120),amount:0,details:cleanName(m[1]),couponEnd:`${yr}-${String(months[m[2].slice(0,3)]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`,sourceUrl:url}); }
  products=products.filter((x,i,a)=>a.findIndex(y=>y.name.toLowerCase()===x.name.toLowerCase()&&Math.abs(y.sale-x.sale)<.001)===i);
  return {products,promos};
}

function classifySource(result, label) { return {label,ok:!!result.ok,count:result.count||0,message:result.message||''}; }

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  const products=[]; const promotions=[]; const sources={};

  // Dollar General — official public coupon page.
  try { const html=await fetchText(DG_COUPONS); const rows=parseDG(html); promotions.push(...rows); sources.dg=classifySource({ok:rows.length>0,count:rows.length,message:rows.length?'Official coupon page answered':'Page answered but no coupon rows were readable'},'Dollar General coupons'); }
  catch(e){ sources.dg=classifySource({ok:false,message:e.message},'Dollar General coupons'); }

  // Walmart — public browse/search pages. Prices may still vary by selected store/location.
  let walmartCount=0;
  for(const [cat,url] of WALMART_PAGES){ try{ const html=await fetchText(url,7500); const rows=parseWalmart(html,cat,url); products.push(...rows); walmartCount+=rows.length; }catch{} }
  sources.walmart=classifySource({ok:walmartCount>0,count:walmartCount,message:walmartCount?'Public Walmart pages answered':'Walmart did not expose readable public prices on this refresh'},'Walmart public prices');

  // Kroger — public search/category pages with promotions.
  let krogerCount=0, krogerPromos=0;
  for(const [cat,url] of KROGER_PAGES){ try{ const html=await fetchText(url,7500); const parsed=parseKroger(html,cat,url); products.push(...parsed.products); promotions.push(...parsed.promos); krogerCount+=parsed.products.length; krogerPromos+=parsed.promos.length; }catch{} }
  sources.kroger=classifySource({ok:krogerCount>0,count:krogerCount+krogerPromos,message:krogerCount?'Public Kroger pages answered':'Kroger did not expose readable public prices on this refresh'},'Kroger public prices & promos');

  // Account-specific rewards are not guessed. The front end can keep bundled examples, but they are not marked live.
  sources.ibotta=classifySource({ok:false,message:'Many offers are account/location-specific; no reliable public account feed connected'},'Ibotta');
  sources.fetch=classifySource({ok:false,message:'Many offers are account/location-specific; no reliable public account feed connected'},'Fetch');

  const dedupedProducts=products.filter((x,i,a)=>a.findIndex(y=>y.store===x.store&&y.name.toLowerCase()===x.name.toLowerCase()&&Math.abs(y.sale-x.sale)<.001)===i).slice(0,700);
  const dedupedPromos=promotions.filter((x,i,a)=>a.findIndex(y=>y.store===x.store&&y.title.toLowerCase()===x.title.toLowerCase()&&y.couponEnd===x.couponEnd)===i).slice(0,700);
  const live=Object.values(sources).some(s=>s.ok);
  res.status(200).json({live,updatedAt:new Date().toISOString(),products:dedupedProducts,promotions:dedupedPromos,sources,coverageNote:'Public retailer data only. Store, ZIP code, loyalty account and app-only offers can differ. The app does not label unavailable account-specific offers as verified.'});
}
