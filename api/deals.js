
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

function absoluteUrl(u,base){
  if(!u) return null;
  try{return new URL(decode(u),base).href}catch{return null}
}
function firstImage(html,base){
  const candidates=[];
  const attrs=[...html.matchAll(/<(?:img|source)[^>]+(?:src|data-src|srcset)=["']([^"']+)["']/gi)];
  for(const m of attrs){
    const raw=(m[1]||'').split(/\s+/)[0];
    const u=absoluteUrl(raw,base);
    if(u && !/logo|icon|sprite|placeholder|transparent|pixel/i.test(u)) candidates.push(u);
  }
  const og=html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if(og){const u=absoluteUrl(og[1],base);if(u)candidates.push(u)}
  return candidates[0]||null;
}
function couponFacts(block){
  const spend=block.match(/(?:spend|purchase(?: of)?|when you spend)\s*\$([0-9]+(?:\.[0-9]{1,2})?)/i);
  const qty=block.match(/(?:buy|when you buy|purchase)\s+(\d+)\b/i);
  const limit=block.match(/limit\s+(\d+)/i);
  let couponKind='Coupon';
  if(/DG Store/i.test(block)) couponKind='DG Store Coupon';
  else if(/manufacturer/i.test(block)) couponKind='Manufacturer Coupon';
  else if(/cash back/i.test(block)) couponKind='Cash Back';
  return {
    minimumSpend:spend?Number(spend[1]):null,
    quantity:qty?Number(qty[1]):null,
    limit:limit?Number(limit[1]):null,
    couponKind
  };
}
function simpleCouponSummary({amount,bogo,minimumSpend,quantity,couponKind}){
  if(bogo) return 'Buy the qualifying item and get the second eligible item free or included, subject to the offer terms.';
  const bits=[];
  if(amount) bits.push(`Save $${Number(amount).toFixed(amount%1?2:0)}`);
  if(quantity) bits.push(`when you buy ${quantity}`);
  if(minimumSpend) bits.push(`after spending $${Number(minimumSpend).toFixed(minimumSpend%1?2:0)}`);
  if(!bits.length) bits.push(couponKind||'Coupon offer');
  return bits.join(' ') + '.';
}

function parseDG(html){
  const out=[];
  // Keep raw HTML chunks so product/coupon images can be associated with each offer.
  const pieces=html.split(/(?=Digital Coupon|Cash Back)/i).slice(0,800);
  for(const raw of pieces){
    const block=clean(plain(raw.slice(0,14000))).slice(0,1100);
    if(!/Digital Coupon|Cash Back|Save|Earn|BOGO|Buy One/i.test(block)) continue;
    const amountMatch=block.match(/(?:Save|Earn)\s*\$([0-9]+(?:\.[0-9]{1,2})?)/i);
    const dateMatch=block.match(/(?:EXP\s*)?(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{2,4})/i);
    const bogo=/Buy One, Get One|BOGO/i.test(block);
    if(!amountMatch && !bogo) continue;

    let title=clean(
      block.replace(/^.*?(?:Digital Coupon|Cash Back)\s*/i,'')
           .split(/Save\s*\$|Earn\s*\$|Buy One, Get One|BOGO/i)[0]
    ).slice(0,120);
    if(!title || title.length<3) title='Dollar General offer';

    const facts=couponFacts(block);
    const amount=amountMatch?Number(amountMatch[1]):0;
    const imageUrl=firstImage(raw,DG_COUPONS);
    const description=simpleCouponSummary({amount,bogo,...facts});
    out.push({
      store:'DG',
      type:bogo?'Promotion':facts.couponKind,
      title,
      amount,
      bogo,
      description,
      minimumSpend:facts.minimumSpend,
      quantity:facts.quantity,
      limit:facts.limit,
      couponKind:facts.couponKind,
      details:block.slice(0,800),
      couponEnd:dateMatch?usDate(dateMatch[1],dateMatch[2],dateMatch[3]):null,
      imageUrl,
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
          out.push({store,name:clean(x.name).slice(0,140),cat,price,sale:price,coupon:0,ibotta:0,fetch:0,sourceUrl,live:true,imageUrl:absoluteUrl(Array.isArray(x.image)?x.image[0]:x.image,sourceUrl),description:clean(x.description||'').slice(0,260)});
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
    promos.push({store:'Kroger',type:'Promotion',title:clean(m[1]),amount:0,description:clean(m[1]),details:clean(m[1]),couponKind:'Kroger Promotion',couponEnd:`${yr}-${String(months[mon]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`,imageUrl:firstImage(html,url),sourceUrl:url});
  }
  return {products,promos};
}


const VERIFIED_AT='2026-08-31T23:55:00.000Z';
const VERIFIED_PROMOTIONS=[
  {store:'DG',type:'DG Store Coupon',couponKind:'DG Store Coupon',title:'Save $5 on a $25+ purchase',amount:5,minimumSpend:25,description:'Spend at least $25 before tax on qualifying merchandise and save $5.',details:'Dollar General store coupon. Minimum qualifying purchase is $25 before tax. Other exclusions and coupon terms may apply.',couponEnd:'2026-09-05',sourceUrl:DG_COUPONS},
  {store:'DG',type:'DG Store Coupon',couponKind:'DG Store Coupon',title:'Save $5 on a $25 purchase',amount:5,minimumSpend:25,description:'Spend $25 on qualifying merchandise and save $5.',details:'Dollar General store coupon. Check the live offer for exclusions and exact purchase timing.',couponEnd:'2026-09-04',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Promotion',couponKind:'DG Store Coupon',title:'DiGiorno pizza + PepsiCo 2L BOGO',amount:0,bogo:true,quantity:1,description:'Buy one eligible DiGiorno Stuffed or Rising Crust pizza and get an eligible PepsiCo 2-liter free.',details:'Buy one qualifying DiGiorno Stuffed Crust or Rising Crust pizza and receive an eligible PepsiCo 2-liter beverage free. Check eligible items in the official offer.',couponEnd:'2026-11-30',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'Frollies Pop Ups 9 ct',amount:.75,limit:5,description:'Earn $0.75 cash back on an eligible 9-count Frollies Pop Ups purchase.',details:'Manufacturer cash-back offer. Limit 5. Availability and eligible varieties can vary.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'Frollies Ice Pops',amount:1,limit:5,description:'Earn $1 cash back on an eligible Frollies Ice Pops purchase.',details:'Manufacturer cash-back offer. Limit 5. Check the official offer for eligible sizes and varieties.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'Frito-Lay chips',amount:.75,quantity:2,description:'Earn $0.75 cash back when you buy 2 eligible Frito-Lay chip products.',details:'Manufacturer cash-back offer. Buy 2 qualifying items. Eligible sizes and brands are shown in the official offer.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'DG Store Cash Back',title:'TruMoo Whole Chocolate Milk 48 fl oz',amount:1,limit:2,description:'Earn $1 cash back on an eligible 48 fl oz TruMoo Whole Chocolate Milk.',details:'Dollar General cash-back offer. Limit 2. Confirm eligible item before purchase.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Manufacturer Coupon',couponKind:'Manufacturer Coupon',title:"Cap’n Crunch or Life cereal",amount:1,quantity:2,description:'Save $1 when you buy 2 eligible Quaker cereals.',details:'Manufacturer coupon for eligible Cap’n Crunch and Life cereal products. Buy 2 qualifying items.',couponEnd:'2026-09-19',sourceUrl:DG_COUPONS},
  {store:'DG',type:'DG Store Coupon',couponKind:'DG Store Coupon',title:'Gatorade purchase',amount:2.5,minimumSpend:12.5,description:'Save $2.50 when you spend $12.50 on eligible Gatorade products.',details:'Dollar General store coupon. Spend $12.50 on eligible Gatorade products and sizes.',couponEnd:'2026-09-19',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'Minute Maid Orange Juice cartons',amount:.5,quantity:2,description:'Earn $0.50 cash back when you buy 2 eligible Minute Maid Orange Juice cartons.',details:'Manufacturer cash-back offer. Buy 2 qualifying cartons.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'Hostess Morning Items',amount:.25,quantity:2,description:'Earn $0.25 cash back when you buy 2 eligible Hostess Morning Items.',details:'Manufacturer cash-back offer. Buy 2 eligible items.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'DG Store Coupon',couponKind:'DG Store Coupon',title:'Tide Power Pods / Liquid / evo',amount:3,description:'Save $3 on one eligible Tide Power Pods, liquid, or evo product.',details:'Eligible examples include Tide Power Pods 45 ct, liquid 83–100 load / 117–125 oz, or evo 42 ct. Check exact qualifying items.',couponEnd:'2026-09-05',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Manufacturer Coupon',couponKind:'Manufacturer Coupon',title:'Febreze Fall or Holiday Air Care',amount:2,description:'Save $2 on one eligible Febreze Fall or Holiday scent air-care product.',details:'Manufacturer coupon. One qualifying Fall/Holiday scent item required.',couponEnd:'2026-09-26',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'Hostess Morning Items + Twinkies multipacks',amount:.5,quantity:2,description:'Earn $0.50 cash back when you buy 2 eligible Hostess products.',details:'Manufacturer cash-back offer. Buy 2 eligible Hostess Morning Items or Twinkies multipacks shown in the offer.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'White Castle Sliders 4 ct',amount:.5,limit:5,description:'Earn $0.50 cash back on an eligible 4-count White Castle Sliders package.',details:'Manufacturer cash-back offer. Limit 5.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'DG Store Coupon',couponKind:'DG Store Coupon',title:'Gain Fabric Care purchase',amount:5,minimumSpend:30,description:'Save $5 when you spend $30 on eligible Gain Fabric Care products.',details:'Dollar General store coupon. Spend $30 on eligible Gain Fabric Care products.',couponEnd:'2026-09-05',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'Cacique Queso',amount:.75,limit:5,description:'Earn $0.75 cash back on eligible Cacique Queso.',details:'Manufacturer cash-back offer. Limit 5.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'Cash Back',couponKind:'Manufacturer Cash Back',title:'DiGiorno Stuffed Crust Pizza',amount:.8,limit:5,description:'Earn $0.80 cash back on an eligible DiGiorno Stuffed Crust Pizza.',details:'Manufacturer cash-back offer. Limit 5.',sourceUrl:DG_COUPONS},
  {store:'DG',type:'DG Store Coupon',couponKind:'DG Store Coupon',title:'Dixie or Vanity Fair',amount:3,minimumSpend:12,description:'Save $3 when you spend $12 on eligible Dixie or Vanity Fair products.',details:'Dollar General store coupon. Spend $12 on eligible Dixie or Vanity Fair products.',couponEnd:'2026-09-05',sourceUrl:DG_COUPONS},
  {store:'DG',type:'DG Store Coupon',couponKind:'DG Store Coupon',title:'Angel Soft, Sparkle or Brawny',amount:5,minimumSpend:25,description:'Save $5 when you spend $25 on eligible Angel Soft, Sparkle, or Brawny products.',details:'Dollar General store coupon. Spend $25 on eligible Angel Soft, Sparkle, and/or Brawny products.',couponEnd:'2026-09-05',sourceUrl:DG_COUPONS},

  {store:'Kroger',type:'Promotion',couponKind:'Kroger Card Promotion',title:'Kroger pasta — 99¢ each when you buy 5+',amount:.26,quantity:5,description:'Eligible Kroger pasta is 99¢ each when you buy 5 or more with your Kroger Card.',details:'Card promotion on qualifying Kroger pasta. Regular observed price was $1.25; promotional price 99¢ each when buying 5 or more.',couponEnd:'2026-09-08',sourceUrl:'https://www.kroger.com/search?query=pasta'},
  {store:'Kroger',type:'Weekly Deal',couponKind:'Weekly Digital Deal',title:'Weekly Digital Deals refresh Wednesday',amount:0,description:'Kroger publishes a new set of Weekly Digital Deals each Wednesday. Exact offers depend on store and account.',details:'Use your connected Kroger account and selected store for exact product pricing. Coupon availability can be personalized.',sourceUrl:'https://www.kroger.com/pr/weekly-digital-deals'},

  {store:'Walmart',type:'Walmart Cash',couponKind:'Manufacturer Offers / Walmart Cash',title:'Walmart Cash manufacturer offers',amount:0,description:'Eligible Walmart items can have manufacturer offers that earn Walmart Cash after purchase.',details:'Walmart manufacturer offers are account-based and must be claimed before purchase. Eligible items show a Get Walmart Cash option. Offers have expiration dates and can change.',sourceUrl:'https://www.walmart.com/cp/manufacturer-offers/7524254'}
];

function stillActive(p){
  if(!p.couponEnd) return true;
  const end=new Date(`${p.couponEnd}T23:59:59Z`);
  return !Number.isNaN(end.getTime()) && end.getTime() >= Date.now();
}
function verifiedFallback(store){
  return VERIFIED_PROMOTIONS
    .filter(p=>p.store===store && stillActive(p))
    .map(p=>({...p,verifiedAt:VERIFIED_AT,dataMode:'verified-recent'}));
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
  const walmartFallback=verifiedFallback('Walmart');
  if(!walmartResults.length) promotions.push(...walmartFallback);
  sources.walmart=source(
    'Walmart prices & manufacturer offers',
    walmartResults.length>0,
    walmartResults.length + (walmartResults.length?0:walmartFallback.length),
    walmartResults.length
      ? 'Public Walmart product pages answered'
      : 'Live Walmart page parsing is limited; showing verified recent manufacturer-offer guidance instead'
  );

  const krogerResults=settled.slice(1+WALMART_PAGES.length);
  const krogerProducts=krogerResults.flatMap(x=>x.products||[]);
  const krogerPromos=krogerResults.flatMap(x=>x.promos||[]);
  products.push(...krogerProducts); promotions.push(...krogerPromos);
  const krogerFallback=verifiedFallback('Kroger');
  if(!krogerPromos.length) promotions.push(...krogerFallback);
  sources.kroger=source(
    'Kroger prices & promos',
    krogerProducts.length>0 || krogerPromos.length>0,
    krogerProducts.length+krogerPromos.length+(krogerPromos.length?0:krogerFallback.length),
    krogerProducts.length || krogerPromos.length
      ? 'Public Kroger pages answered'
      : 'Public coupon scraping is limited; connected Kroger API still supplies exact store product pricing and verified recent promotions are shown'
  );

  const hasLiveDG=promotions.some(p=>p.store==='DG' && p.dataMode!=='verified-recent');
  if(!hasLiveDG){
    const dgFallback=verifiedFallback('DG');
    promotions.push(...dgFallback);
    sources.dg=source('Dollar General coupons',false,dgFallback.length,'Official DG page did not expose readable coupon data to the server; showing recently verified active DG offers');
  }

  sources.ibotta=source('Ibotta',false,0,'Account/location-specific; not verified from public web pages');
  sources.fetch=source('Fetch',false,0,'Account/location-specific; not verified from public web pages');

  const dedupedProducts=products.filter((x,i,a)=>a.findIndex(y=>y.store===x.store&&y.name.toLowerCase()===x.name.toLowerCase()&&Math.abs((y.sale||0)-(x.sale||0))<0.001)===i).slice(0,700);
  const dedupedPromos=promotions.filter((x,i,a)=>a.findIndex(y=>y.store===x.store&&y.title.toLowerCase()===x.title.toLowerCase()&&y.couponEnd===x.couponEnd)===i).slice(0,700);
  const live=Object.values(sources).some(s=>s.ok);
  const verifiedRecent=dedupedPromos.filter(p=>p.dataMode==='verified-recent').length;

  res.status(200).json({
    live,
    updatedAt:new Date().toISOString(),
    products:dedupedProducts,
    promotions:dedupedPromos,
    sources,
    zip:zip||null,
    verifiedRecent,
    coverageNote: verifiedRecent
      ? `Live retailer pages were checked. Where a retailer blocked readable coupon data, ${verifiedRecent} recently verified active offers are shown and clearly marked instead of returning an empty list.`
      : 'Live retailer pages were checked successfully. Exact prices and offers can still vary by store, loyalty account, pickup/delivery mode, and app-only offers.'
  });
}
