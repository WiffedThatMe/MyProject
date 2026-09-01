let products = [
  {store:'DG',name:'Tide Liquid Detergent',cat:'Laundry',price:15.95,sale:15.95,coupon:3.00,ibotta:0,fetch:0,couponEnd:'2026-09-05'},
  {store:'DG',name:'Gain Laundry Care',cat:'Laundry',price:10.95,sale:10.00,coupon:2.00,ibotta:1.00,fetch:500},
  {store:'DG',name:'Angel Soft Toilet Paper',cat:'Paper',price:8.95,sale:7.95,coupon:1.50,ibotta:0.50,fetch:0},
  {store:'DG',name:'Sparkle Paper Towels',cat:'Paper',price:7.50,sale:6.75,coupon:1.00,ibotta:0,fetch:750},
  {store:'DG',name:'Mtn Dew 12 Pack',cat:'Drinks',price:8.00,sale:7.00,coupon:2.00,ibotta:0,fetch:500},
  {store:'DG',name:'Gatorade Multipack',cat:'Drinks',price:8.50,sale:7.50,coupon:1.50,ibotta:1.00,fetch:0},
  {store:'DG',name:'Dixie Plates',cat:'Household',price:6.50,sale:5.50,coupon:1.50,ibotta:0,fetch:600},
  {store:'DG',name:'Febreze Air',cat:'Cleaning',price:4.00,sale:4.00,coupon:2.00,ibotta:1.00,fetch:250,couponEnd:'2026-09-26'},
  {store:'DG',name:'Cap’n Crunch Cereal',cat:'Food',price:4.00,sale:3.50,coupon:1.00,ibotta:0.50,fetch:400,couponEnd:'2026-09-19'},
  {store:'DG',name:'White Castle Sliders',cat:'Food',price:6.25,sale:5.75,coupon:0.50,ibotta:1.00,fetch:0},
  {store:'Walmart',name:'Great Value Eggs 12 ct',cat:'Food',price:2.48,sale:2.48,rollback:false,coupon:0,ibotta:0,fetch:0},
  {store:'Walmart',name:'Great Value Bread',cat:'Food',price:1.42,sale:1.42,rollback:false,coupon:0,ibotta:0,fetch:0},
  {store:'Walmart',name:'Great Value Water 24 Pack',cat:'Drinks',price:3.68,sale:3.48,rollback:true,coupon:0,ibotta:0,fetch:0},
  {store:'Walmart',name:'Tide Liquid Detergent',cat:'Laundry',price:15.94,sale:13.94,rollback:true,coupon:2.00,ibotta:2.00,fetch:1000},
  {store:'Walmart',name:'Great Value Paper Towels',cat:'Paper',price:7.48,sale:6.98,rollback:true,coupon:0,ibotta:0,fetch:0},
  {store:'Walmart',name:'Dawn Dish Soap',cat:'Cleaning',price:5.94,sale:4.94,rollback:true,coupon:1.00,ibotta:1.50,fetch:750},
  {store:'Walmart',name:'General Mills Cereal',cat:'Food',price:4.98,sale:3.98,rollback:true,coupon:0,ibotta:1.00,fetch:1200},
  {store:'Walmart',name:'Degree Deodorant',cat:'Personal Care',price:5.97,sale:5.97,rollback:false,coupon:0,ibotta:2.00,fetch:1000},
  {store:'Kroger',name:'Kroger Eggs 12 ct',cat:'Food',price:1.99,sale:1.99,coupon:0,ibotta:0,fetch:0},
  {store:'Kroger',name:'Kroger Pasta',cat:'Food',price:1.49,sale:0.99,coupon:0,ibotta:0,fetch:0},
  {store:'Kroger',name:'Kroger Milk Gallon',cat:'Food',price:3.29,sale:3.29,coupon:0,ibotta:0.50,fetch:0},
  {store:'Kroger',name:'Tide Liquid Detergent',cat:'Laundry',price:16.49,sale:14.99,coupon:2.00,ibotta:2.00,fetch:1000},
  {store:'Kroger',name:'Kroger Soft Drinks 12 Pack',cat:'Drinks',price:5.99,sale:4.99,coupon:0,ibotta:0,fetch:500},
  {store:'Kroger',name:'Kroger Paper Towels',cat:'Paper',price:7.99,sale:6.99,coupon:1.00,ibotta:0.50,fetch:0}
];

const storeNames = {DG:'Dollar General', Walmart:'Walmart', Kroger:'Kroger'};
const el = id => document.getElementById(id);
const money = n => '$' + Math.max(0, n || 0).toFixed(2);
const checkoutPrice = p => Math.max(0, p.sale - p.coupon);
const ibottaBack = p => el('useIbotta').checked ? (p.ibotta || 0) : 0;
const fetchPoints = p => el('useFetch').checked ? (p.fetch || 0) : 0;
const netPrice = p => Math.max(0, checkoutPrice(p) - ibottaBack(p));
const itemSavings = p => Math.max(0, p.price - netPrice(p));
const itemSavingsPct = p => p.price ? itemSavings(p) / p.price : 0;
const HISTORY_KEY = 'couponGamePlan.priceHistory.v1';
const HISTORY_MAX_PER_ITEM = 180;
const productKey = p => `${p.store}::${(p.upc || p.name || '').toLowerCase().trim()}`;

const MANUAL_CART_KEY = 'couponGamePlan.manualCart.v1';

function brandType(p){
  const n=(p.name||'').toLowerCase();
  if (/\bgreat value\b|\bkroger\b|\bclover valley\b|\bstudio selection\b|\bequate\b|\bmarketside\b|\bprivate selection\b|\bsimple truth\b/.test(n)) return 'store';
  return 'name';
}
function productFamily(p){
  const n=(p.name||'').toLowerCase();
  const families=[
    ['toaster pastries',/pop.?tarts?|toaster pastry|toaster pastries/],
    ['laundry detergent',/laundry|detergent|tide|gain/],
    ['paper towels',/paper towel/],
    ['toilet paper',/toilet paper|bath tissue/],
    ['bread',/\bbread\b/],
    ['eggs',/\begg/],
    ['water',/\bwater\b/],
    ['cereal',/\bcereal\b|cap.?n crunch|cheerios|life\b/],
    ['pasta',/\bpasta\b|spaghetti|penne|macaroni/],
    ['milk',/\bmilk\b/],
    ['soft drinks',/soda|soft drink|mtn dew|mountain dew|pepsi|coke|cola/],
    ['dish soap',/dish soap|dishwashing|dawn/],
    ['deodorant',/deodorant|degree/]
  ];
  for(const [name,re] of families) if(re.test(n)) return name;
  return (p.cat||'other').toLowerCase();
}
function manualCartKeys(){
  try{return JSON.parse(localStorage.getItem(MANUAL_CART_KEY)||'[]')||[]}catch{return[]}
}
function saveManualCartKeys(keys){ localStorage.setItem(MANUAL_CART_KEY,JSON.stringify(keys)); }
function cartKey(p){ return productKey(p); }
function isInManualCart(p){ return manualCartKeys().includes(cartKey(p)); }
function addDealToCart(p){
  const keys=manualCartKeys();
  const key=cartKey(p);
  if(!keys.includes(key)) keys.push(key);
  saveManualCartKeys(keys);
  syncManualCart();
}
function removeDealFromCart(key){
  saveManualCartKeys(manualCartKeys().filter(x=>x!==key));
  syncManualCart();
}
function syncManualCart(){
  const keys=manualCartKeys();
  cart=keys.map(k=>products.find(p=>cartKey(p)===k)).filter(Boolean);
  comparisonResults=[];
  renderCart();
  renderDeals();
}
function alternativesFor(p){
  const fam=productFamily(p);
  return products
    .filter(x=>cartKey(x)!==cartKey(p) && productFamily(x)===fam)
    .map(x=>({...x,_net:netPrice(x),_brand:brandType(x)}))
    .sort((a,b)=>a._net-b._net)
    ;
}
function comparisonMessage(p){
  const alts=alternativesFor(p);
  if(!alts.length) return '';
  const best=alts[0];
  const diff=Math.abs(netPrice(p)-netPrice(best));
  if(best._net < netPrice(p)-0.009){
    const brandLabel=best._brand==='store'?'store-brand':'name-brand';
    return `${storeNames[best.store]} ${best.name} is ${money(diff)} cheaper after sales/coupons/rewards (${brandLabel}).`;
  }
  return `${p.name} is the lowest net price among the matching items currently loaded.`;
}
function renderAlternativeRows(p){
  const rows=[{...p,_net:netPrice(p),_brand:brandType(p),_selected:true},...alternativesFor(p)]
    .sort((a,b)=>a._net-b._net);
  if(rows.length<2) return '';
  return `<details class="price-compare"><summary>Compare name brand vs store brand</summary>
    <div class="compare-table">
      ${rows.map((x,i)=>`<div class="compare-row ${x._selected?'selected':''} ${i===0?'best':''}">
        <div><strong>${esc(x.name)}</strong><small>${esc(storeNames[x.store]||x.store)} · ${x._brand==='store'?'Store brand':'Name brand'}</small></div>
        <div><small>Shelf</small><strong>${money(x.price)}</strong></div>
        <div><small>Coupon</small><strong>${x.coupon?'-'+money(x.coupon):'—'}</strong></div>
        <div><small>Checkout</small><strong>${money(checkoutPrice(x))}</strong></div>
        <div><small>Net</small><strong>${money(netPrice(x))}</strong></div>
        ${i===0?'<span class="cheapest-tag">Cheapest</span>':''}
      </div>`).join('')}
    </div>
  </details>`;
}

function parseLocalDate(value) {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function shortDate(value) {
  const d = parseLocalDate(value);
  return d ? new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(d) : '';
}
function daysUntil(value) {
  const d = parseLocalDate(value);
  if (!d) return null;
  const now = new Date();
  now.setHours(0,0,0,0);
  return Math.ceil((d-now)/86400000);
}
function couponTiming(p) {
  if (!p.coupon || !p.couponEnd) return '';
  const days = daysUntil(p.couponEnd);
  if (days === null) return '';
  if (days < 0) return `Expired ${shortDate(p.couponEnd)}`;
  if (days === 0) return `Expires today`;
  if (days === 1) return `Expires tomorrow`;
  return `Expires ${shortDate(p.couponEnd)} · ${days} days left`;
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}') || {}; }
  catch { return {}; }
}
function saveHistory(data) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(data)); } catch {}
}
function recordPriceHistory(list, source='app') {
  const history = loadHistory();
  const now = Date.now();
  list.forEach(p => {
    const key = productKey(p);
    if (!key || !Number.isFinite(Number(p.sale))) return;
    const rows = Array.isArray(history[key]) ? history[key] : [];
    const current = {at:now, store:p.store, name:p.name, shelf:Number(p.price||0), sale:Number(p.sale||0), coupon:Number(p.coupon||0), checkout:checkoutPrice(p), net:netPrice(p), source};
    const last = rows[rows.length-1];
    const priceChanged = !last || last.shelf !== current.shelf || last.sale !== current.sale || last.coupon !== current.coupon || last.checkout !== current.checkout || last.net !== current.net;
    const dayOld = !last || (now-last.at) >= 86400000;
    if (priceChanged || dayOld) rows.push(current);
    history[key] = rows.slice(-HISTORY_MAX_PER_ITEM);
  });
  saveHistory(history);
  renderHistory();
}
function historyStats(p) {
  const rows = loadHistory()[productKey(p)] || [];
  if (!rows.length) return null;
  const salePrices = rows.map(x=>Number(x.sale)).filter(Number.isFinite);
  const netPrices = rows.map(x=>Number(x.net)).filter(Number.isFinite);
  const avg = salePrices.reduce((a,b)=>a+b,0)/salePrices.length;
  return {rows, low:Math.min(...salePrices), high:Math.max(...salePrices), avg, bestNet:Math.min(...netPrices), latest:rows[rows.length-1]};
}
function historyComparison(p) {
  const stats = historyStats(p);
  if (!stats || stats.rows.length < 2) return '';
  const diff = stats.avg - p.sale;
  if (Math.abs(diff) < .01) return `At tracked average`;
  return diff > 0 ? `${money(diff)} below tracked average` : `${money(Math.abs(diff))} above tracked average`;
}
function renderHistory() {
  const list = el('historyList');
  const summary = el('historySummary');
  if (!list || !summary) return;
  const history = loadHistory();
  const entries = Object.values(history).filter(Array.isArray).flatMap(rows => rows.length ? [{key:`${rows[0].store}::${rows[0].name}`, rows}] : []);
  if (!entries.length) {
    summary.textContent = 'Price history starts saving automatically as deals are refreshed.';
    list.innerHTML = '<div class="empty-state">No tracked price history yet.</div>';
    return;
  }
  summary.textContent = `${entries.length} items tracked on this device. A new record is kept when the price changes or at least once per day.`;
  list.innerHTML = entries.sort((a,b)=>(b.rows.at(-1)?.at||0)-(a.rows.at(-1)?.at||0)).slice(0,12).map(entry => {
    const rows=entry.rows; const latest=rows.at(-1); const vals=rows.map(r=>r.sale); const low=Math.min(...vals); const high=Math.max(...vals); const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
    const recent=rows.slice(-6).reverse().map(r=>`<li><span>${new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(r.at))}</span><strong>${money(r.sale)}</strong><small>${r.coupon ? ` · ${money(r.coupon)} coupon` : ''}</small></li>`).join('');
    return `<article class="history-card"><span class="store-badge">${storeNames[latest.store]||latest.store}</span><h3>${latest.name}</h3><div class="history-stats"><div><span>Lowest</span><strong>${money(low)}</strong></div><div><span>Average</span><strong>${money(avg)}</strong></div><div><span>Highest</span><strong>${money(high)}</strong></div><div><span>Today</span><strong>${money(latest.sale)}</strong></div></div><details><summary>Recent prices (${rows.length})</summary><ul class="history-rows">${recent}</ul></details></article>`;
  }).join('');
}
let cart = [];
let comparisonResults = [];
let promotions = [];
let sourceCoverage = null;


function renderSourceCoverage() {
  const box=el('sourceCoverage'); if(!box) return;
  if(!sourceCoverage){ box.innerHTML='<span>Waiting for live source check…</span>'; return; }
  const order=['dg','walmart','kroger','ibotta','fetch'];
  box.innerHTML=order.map(k=>{ const s=sourceCoverage[k]; if(!s) return ''; return `<span class="source-pill ${s.ok?'source-ok':'source-limited'}"><b>${s.ok?'✓':'!'}</b> ${s.label}${s.ok&&s.count?` · ${s.count}`:''}</span>`; }).join('');
}

function esc(s=''){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function couponImage(p){
  if(p.imageUrl) return `<img class="coupon-image" src="${esc(p.imageUrl)}" alt="${esc(p.title||'Coupon product')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.coupon-image-wrap').classList.add('image-failed');this.remove()">`;
  return '';
}
function couponFact(label,value){
  if(value===null||value===undefined||value==='') return '';
  return `<div class="coupon-fact"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function promotionTiming(p){
  if(!p.couponEnd) return ''; const d=daysUntil(p.couponEnd);
  if(d===null) return ''; if(d<0) return `Expired ${shortDate(p.couponEnd)}`; if(d===0) return 'Expires today'; if(d===1) return 'Expires tomorrow'; return `Expires ${shortDate(p.couponEnd)} · ${d} days left`;
}

const COUPON_PLAN_KEY='couponGamePlan.couponPlan.v1';

function couponId(p){
  return [
    p.store||'',
    p.title||'',
    p.amount||0,
    p.minimumSpend||0,
    p.quantity||0,
    p.couponEnd||''
  ].join('::').toLowerCase();
}
function loadCouponPlan(){
  try{return JSON.parse(localStorage.getItem(COUPON_PLAN_KEY)||'{}')||{}}
  catch{return {}}
}
function saveCouponPlan(plan){
  localStorage.setItem(COUPON_PLAN_KEY,JSON.stringify(plan));
}
function isCouponSelected(p){
  return !!loadCouponPlan()[couponId(p)];
}
function selectCoupon(p){
  const plan=loadCouponPlan(), id=couponId(p);
  if(plan[id]) delete plan[id];
  else {
    plan[id]={
      id,
      store:p.store,
      title:p.title,
      amount:Number(p.amount||0),
      minimumSpend:p.minimumSpend??null,
      quantity:p.quantity??null,
      limit:p.limit??null,
      couponEnd:p.couponEnd||null,
      couponKind:p.couponKind||p.type||'Offer',
      description:p.description||'',
      sourceUrl:p.sourceUrl||null,
      selectedAt:Date.now(),
      used:false,
      worked:null,
      expectedSavings:Number(p.amount||0),
      actualSavings:null,
      checkoutNotes:'',
      verifiedAt:null
    };
  }
  saveCouponPlan(plan);
  renderPromotions();
  renderCouponPlan();
}
function updateCouponUse(id,patch){
  const plan=loadCouponPlan();
  if(!plan[id]) return;
  plan[id]={...plan[id],...patch};
  if(patch.used===true || patch.worked!==undefined || patch.actualSavings!==undefined) {
    plan[id].verifiedAt=Date.now();
  }
  saveCouponPlan(plan);
  renderCouponPlan();
  renderPromotions();
}
function couponResultLabel(c){
  if(!c.used) return 'Not used yet';
  if(c.worked==='yes') return 'Worked';
  if(c.worked==='partial') return 'Partially worked';
  if(c.worked==='no') return 'Did not work';
  return 'Used — result not entered';
}
function renderCouponPlan(){
  const box=el('selectedCoupons');
  if(!box) return;
  const plan=loadCouponPlan();
  const rows=Object.values(plan).sort((a,b)=>(b.selectedAt||0)-(a.selectedAt||0));
  const selectedCount=rows.length;
  const expected=rows.reduce((s,c)=>s+Number(c.expectedSavings||0),0);
  const verified=rows.filter(c=>c.used).length;
  const actual=rows.reduce((s,c)=>s+(c.used && Number.isFinite(Number(c.actualSavings))?Number(c.actualSavings):0),0);

  if(el('selectedCouponCount')) el('selectedCouponCount').textContent=String(selectedCount);
  if(el('expectedCouponSavings')) el('expectedCouponSavings').textContent=money(expected);
  if(el('verifiedCouponCount')) el('verifiedCouponCount').textContent=String(verified);
  if(el('actualCouponSavings')) el('actualCouponSavings').textContent=money(actual);

  const results=el('couponPlanResults');
  if(results){
    const worked=rows.filter(c=>c.used&&c.worked==='yes').length;
    const partial=rows.filter(c=>c.used&&c.worked==='partial').length;
    const failed=rows.filter(c=>c.used&&c.worked==='no').length;
    const pending=rows.filter(c=>!c.used).length;
    results.innerHTML=selectedCount
      ? `<span><strong>${worked}</strong> worked</span><span><strong>${partial}</strong> partial</span><span><strong>${failed}</strong> failed</span><span><strong>${pending}</strong> still planned</span>`
      : '';
  }

  if(!rows.length){
    box.innerHTML='<div class="empty-state">Select coupons from Live Coupons & Promotions to build your plan.</div>';
    return;
  }

  box.innerHTML=rows.map(c=>{
    const actualValue=(c.actualSavings===null||c.actualSavings===undefined)?'':Number(c.actualSavings).toFixed(2);
    const verifiedText=c.verifiedAt?`Last updated ${new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(c.verifiedAt))}`:'';
    return `<article class="selected-coupon-card">
      <div class="selected-coupon-head">
        <div>
          <div class="coupon-labels">
            <span class="store-badge">${esc(storeNames[c.store]||c.store)}</span>
            <span class="badge coupon">${esc(c.couponKind)}</span>
            <span class="result-badge ${c.worked||(!c.used?'pending':'used')}">${esc(couponResultLabel(c))}</span>
          </div>
          <h3>${esc(c.title)}</h3>
          <p class="coupon-summary">${esc(c.description||'')}</p>
        </div>
        <button class="secondary remove-coupon" type="button" data-remove-coupon="${esc(c.id)}">Remove</button>
      </div>

      <div class="coupon-facts">
        ${couponFact('Expected savings',money(c.expectedSavings||0))}
        ${couponFact('Minimum spend',c.minimumSpend?money(c.minimumSpend):null)}
        ${couponFact('Buy',c.quantity||null)}
        ${couponFact('Expires',c.couponEnd?shortDate(c.couponEnd):null)}
      </div>

      <div class="coupon-verification-form">
        <label class="form-check">
          <input type="checkbox" data-used-coupon="${esc(c.id)}" ${c.used?'checked':''}>
          <span>I used this coupon</span>
        </label>

        <label>
          Did it work?
          <select data-worked-coupon="${esc(c.id)}" ${c.used?'':'disabled'}>
            <option value="" ${!c.worked?'selected':''}>Choose result</option>
            <option value="yes" ${c.worked==='yes'?'selected':''}>Yes — worked as intended</option>
            <option value="partial" ${c.worked==='partial'?'selected':''}>Partially</option>
            <option value="no" ${c.worked==='no'?'selected':''}>No — did not work</option>
          </select>
        </label>

        <label>
          Actual savings
          <div class="money-input">
            <span>$</span>
            <input type="number" min="0" step="0.01" inputmode="decimal"
              data-actual-coupon="${esc(c.id)}"
              value="${esc(actualValue)}"
              placeholder="${Number(c.expectedSavings||0).toFixed(2)}"
              ${c.used?'':'disabled'}>
          </div>
        </label>

        <label class="coupon-notes-label">
          What happened?
          <textarea rows="2" data-notes-coupon="${esc(c.id)}" placeholder="Example: coupon scanned fine, item size was wrong, cashier override, only $2 came off..." ${c.used?'':'disabled'}>${esc(c.checkoutNotes||'')}</textarea>
        </label>
      </div>
      ${verifiedText?`<div class="verified-note">${esc(verifiedText)}</div>`:''}
    </article>`;
  }).join('');

  box.querySelectorAll('[data-remove-coupon]').forEach(btn=>btn.addEventListener('click',()=>{
    const plan=loadCouponPlan(); delete plan[btn.dataset.removeCoupon]; saveCouponPlan(plan); renderCouponPlan(); renderPromotions();
  }));
  box.querySelectorAll('[data-used-coupon]').forEach(input=>input.addEventListener('change',()=>{
    updateCouponUse(input.dataset.usedCoupon,{used:input.checked, worked:input.checked?loadCouponPlan()[input.dataset.usedCoupon]?.worked:null});
  }));
  box.querySelectorAll('[data-worked-coupon]').forEach(select=>select.addEventListener('change',()=>{
    updateCouponUse(select.dataset.workedCoupon,{worked:select.value||null});
  }));
  box.querySelectorAll('[data-actual-coupon]').forEach(input=>input.addEventListener('change',()=>{
    const v=input.value===''?null:Math.max(0,Number(input.value)||0);
    updateCouponUse(input.dataset.actualCoupon,{actualSavings:v});
  }));
  box.querySelectorAll('[data-notes-coupon]').forEach(input=>input.addEventListener('change',()=>{
    updateCouponUse(input.dataset.notesCoupon,{checkoutNotes:input.value.slice(0,500)});
  }));
}

function renderPromotions(){
  const box=el('promotions'); if(!box) return; const filter=el('promotionStore')?.value||'All';
  const rows=promotions.filter(p=>(filter==='All'||p.store===filter)&&(!p.couponEnd||daysUntil(p.couponEnd)>=0)).sort((a,b)=>{ const ad=daysUntil(a.couponEnd), bd=daysUntil(b.couponEnd); return (ad??9999)-(bd??9999); });
  if(!rows.length){ box.innerHTML='<div class="empty-state">No live promotions were readable from the selected source on this refresh.</div>'; return; }

  box.innerHTML=rows.map(p=>{
    const timing=promotionTiming(p);
    const summary=p.description || (p.amount?`Save ${money(p.amount)} on qualifying items.`:'See the offer details below.');
    const spend=p.minimumSpend?money(p.minimumSpend):null;
    const qty=p.quantity?String(p.quantity):null;
    const limit=p.limit?String(p.limit):null;
    return `<article class="promotion-card visual-coupon">
      <div class="coupon-image-wrap ${p.imageUrl?'':'no-image'}">
        ${couponImage(p)}
        <div class="coupon-image-fallback"><span>${esc((storeNames[p.store]||p.store).slice(0,2))}</span><small>Offer</small></div>
      </div>
      <div class="coupon-main">
        <div class="coupon-labels">
          <span class="store-badge">${esc(storeNames[p.store]||p.store)}</span>
          <span class="badge coupon">${esc(p.couponKind||p.type||'Offer')}</span>
          ${p.dataMode==='verified-recent'?'<span class="badge verified-recent">Verified recent</span>':''}
        </div>
        <h3>${esc(p.title)}</h3>
        ${p.amount?`<div class="save">${money(p.amount)} savings</div>`:''}
        <p class="coupon-summary">${esc(summary)}</p>
        ${p.dataMode==='verified-recent'&&p.verifiedAt?`<p class="verified-note">Last independently verified ${new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(p.verifiedAt))}. The official retailer source is linked below.</p>`:''}
        <div class="coupon-facts">
          ${couponFact('Buy',qty)}
          ${couponFact('Minimum spend',spend)}
          ${couponFact('Limit',limit)}
          ${couponFact('Expires',p.couponEnd?shortDate(p.couponEnd):null)}
        </div>
        ${timing?`<span class="badge expiry ${daysUntil(p.couponEnd)<=2?'urgent':''}">${esc(timing)}</span>`:''}
        <div class="coupon-card-actions">
          <button type="button" class="${isCouponSelected(p)?'selected-coupon-button':'select-coupon-button'}" data-select-coupon="${esc(couponId(p))}">
            ${isCouponSelected(p)?'✓ Selected':'Select Coupon'}
          </button>
        </div>
        <details class="coupon-details">
          <summary>View coupon details</summary>
          <div class="coupon-detail-body">
            <p>${esc(p.details||summary)}</p>
            ${p.sourceUrl?`<a class="source-link" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">Open official offer source</a>`:''}
          </div>
        </details>
      </div>
    </article>`;
  }).join('');
  box.querySelectorAll('[data-select-coupon]').forEach(btn=>btn.addEventListener('click',()=>{
    const p=rows.find(x=>couponId(x)===btn.dataset.selectCoupon);
    if(p) selectCoupon(p);
  }));
}

function selectedNeeds() {
  if (el('anything').checked) return [];
  return [...document.querySelectorAll('.need:checked')].map(x => x.value);
}
function scoreProduct(p, goal) {
  if (goal === 'save') return itemSavings(p) + (fetchPoints(p) / 1000);
  if (goal === 'oop') return 1 / Math.max(0.01, checkoutPrice(p));
  return (itemSavingsPct(p) * 3) + (itemSavings(p) / Math.max(1, netPrice(p))) + (fetchPoints(p) / 5000);
}
function eligibleForStore(store) {
  const needs = selectedNeeds();
  return products.filter(p => p.store === store && (!needs.length || needs.includes(p.cat)));
}
function buildForStore(store, budget, goal) {
  const candidates = eligibleForStore(store).slice().sort((a,b) => scoreProduct(b, goal) - scoreProduct(a, goal));
  let remaining = budget;
  const chosen = [];
  for (const p of candidates) {
    const cost = checkoutPrice(p);
    if (cost <= remaining + 0.0001) { chosen.push(p); remaining -= cost; }
  }
  return summarizeStore(store, chosen);
}
function summarizeStore(store, items) {
  const retail = items.reduce((s,p) => s + p.price, 0);
  let checkout = items.reduce((s,p) => s + checkoutPrice(p), 0);
  let dgDiscount = 0;
  if (store === 'DG' && items.reduce((s,p) => s + p.sale, 0) >= 25) {
    dgDiscount = 5;
    checkout = Math.max(0, checkout - dgDiscount);
  }
  const cashBack = items.reduce((s,p) => s + ibottaBack(p), 0);
  const points = items.reduce((s,p) => s + fetchPoints(p), 0);
  const net = Math.max(0, checkout - cashBack);
  const savings = Math.max(0, retail - net);
  const rate = retail ? savings / retail : 0;
  return {store, items, retail, checkout, cashBack, points, net, savings, rate, dgDiscount};
}
function compareScore(r, goal) {
  if (!r.items.length) return -Infinity;
  if (goal === 'save') return r.savings;
  if (goal === 'oop') return -r.net;
  return (r.rate * 100) + (r.retail / Math.max(1, r.net)) + (r.items.length * .25);
}
function buildCart() {
  let budget = Number(el('budget').value);
  if (!Number.isFinite(budget) || budget <= 0) { budget = 25; el('budget').value = '25'; }
  const goal = el('goal').value;
  if (el('store').value === 'Compare') {
    comparisonResults = ['DG','Walmart','Kroger'].map(s => buildForStore(s, budget, goal));
    comparisonResults.sort((a,b) => compareScore(b, goal) - compareScore(a, goal));
    cart = comparisonResults[0]?.items || [];
    renderComparison();
wireStoreListToggles(document);
  } else {
    comparisonResults = [];
    cart = buildForStore(el('store').value, budget, goal).items;
    renderComparison();
  }
  renderCart();
  renderDeals();
}
function badges(p) {
  const tags = [];
  if (p.store === 'Walmart' && p.rollback) tags.push('<span class="badge rollback">Rollback</span>');
  if (p.coupon > 0) {
    tags.push(`<span class="badge coupon">Coupon ${money(p.coupon)}</span>`);
    const timing = couponTiming(p);
    if (timing) tags.push(`<span class="badge expiry ${daysUntil(p.couponEnd) <= 2 ? 'urgent' : ''}">${timing}</span>`);
  }
  if (ibottaBack(p) > 0) tags.push(`<span class="badge ibotta">Ibotta ${money(ibottaBack(p))}</span>`);
  if (fetchPoints(p) > 0) tags.push(`<span class="badge fetch">Fetch ${fetchPoints(p).toLocaleString()} pts</span>`);
  return tags.join(' ');
}

function storeItemListHtml(items, store){
  const safeItems = Array.isArray(items) ? items : [];
  const rows = safeItems.map((p,i)=>`<li>${i+1}. ${esc(p.name)} — ${money(netPrice(p))} net</li>`).join('');
  return `<div class="store-result-list-wrap">
    <ol class="store-result-list">${rows}</ol>
    ${safeItems.length>5 ? `<button type="button" class="secondary store-list-toggle" data-store-list-toggle="${esc(store)}">Show all ${safeItems.length} items</button>` : ''}
  </div>`;
}
function wireStoreListToggles(root=document){
  root.querySelectorAll('[data-store-list-toggle]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const wrap=btn.closest('.store-result-list-wrap');
      if(!wrap) return;
      const list=wrap.querySelector('.store-result-list');
      if(!list) return;
      const expanded=wrap.classList.toggle('expanded');
      btn.textContent=expanded ? 'Show fewer items' : `Show all ${list.children.length} items`;
    });
  });
}

function renderComparison() {
  const panel = el('comparePanel');
  const container = el('comparison');
  if (el('store').value !== 'Compare' || !comparisonResults.length) { panel.hidden = true; container.innerHTML = ''; return; }
  panel.hidden = false;
  const winner = comparisonResults[0];
  container.innerHTML = comparisonResults.map(r => `
    <article class="compare-card ${r.store === winner.store ? 'winner' : ''}">
      ${r.store === winner.store ? '<span class="winner-tag">Best match for your goal</span>' : ''}
      <h3 class="store-name">${storeNames[r.store]}</h3>
      <div class="compare-numbers">
        <div><span>Shelf value</span><strong>${money(r.retail)}</strong></div>
        <div><span>Checkout</span><strong>${money(r.checkout)}</strong></div>
        <div><span>Net cost</span><strong>${money(r.net)}</strong></div>
        <div><span>You save</span><strong>${money(r.savings)}</strong></div>
      </div>
      <div class="meta">${r.items.length} items · ${Math.round(r.rate*100)}% savings${r.cashBack ? ` · ${money(r.cashBack)} Ibotta` : ''}${r.points ? ` · ${r.points.toLocaleString()} Fetch pts` : ''}</div>
      <ol class="compare-items">${r.items.map(p => `<li>${p.name} — ${money(netPrice(p))} net</li>`).join('') || '<li>No matching items fit the budget.</li>'}</ol>
    </article>`).join('');
}
function renderCart() {
  const cartEl = el('cart');
  cartEl.innerHTML = '';
  if (!cart.length) {
    cartEl.innerHTML = '<div class="empty-state">Your cart is empty. Use “Add to Cart” on any deal below.</div>';
    updateSummary();
    return;
  }
  cart.forEach(p => {
    const row = document.createElement('div');
    row.className = 'cart-item cart-item-rich';
    const saleLabel = p.store === 'Walmart' && p.rollback ? 'Rollback' : 'Sale';
    const compareNote=comparisonMessage(p);
    row.innerHTML = `<div class="cart-item-main">
      <div>
        <span class="store-badge">${storeNames[p.store]}</span>
        <span class="brand-badge ${brandType(p)}">${brandType(p)==='store'?'Store brand':'Name brand'}</span>
        <h3>${esc(p.name)}</h3>
        <div class="meta">Shelf ${money(p.price)} · ${saleLabel} ${money(p.sale)} · Checkout ${money(checkoutPrice(p))}</div>
        <div class="badges">${badges(p)}</div>
        ${compareNote?`<div class="compare-note">${esc(compareNote)}</div>`:''}
      </div>
      <div class="price-block"><strong>${money(netPrice(p))}</strong><small>Net after rewards</small>
        <button class="secondary remove-cart-item" type="button" data-cart-remove="${esc(cartKey(p))}">Remove</button>
      </div>
    </div>
    ${renderAlternativeRows(p)}`;
    cartEl.appendChild(row);
  });
  cartEl.querySelectorAll('[data-cart-remove]').forEach(btn=>btn.addEventListener('click',()=>removeDealFromCart(btn.dataset.cartRemove)));
  updateSummary();
}

function updateSummary() {
  let summary;
  if (el('store').value === 'Compare' && comparisonResults.length) summary = comparisonResults[0];
  else summary = summarizeStore(el('store').value, cart);
  const {retail, checkout, cashBack, points, net, savings, rate, dgDiscount} = summary;
  el('retail').textContent = money(retail); el('pay').textContent = money(checkout); el('cashback').textContent = money(cashBack); el('net').textContent = money(net); el('save').textContent = money(savings); el('rate').textContent = Math.round(rate*100)+'%';
  if (cart.length) {
    const name = el('store').value === 'Compare' ? `${storeNames[summary.store]} wins this comparison` : storeNames[summary.store];
    el('summaryText').textContent = `${name}: ${cart.length} items with ${money(retail)} shelf value. Pay about ${money(checkout)} at checkout, get ${money(cashBack)} back from Ibotta, for a net cost of ${money(net)}.`;
  } else el('summaryText').textContent = 'Choose one store or Compare All Stores, set your budget, then build your cart.';
  const bits=[]; if(dgDiscount) bits.push(`DG threshold discount: ${money(dgDiscount)}`); if(cashBack) bits.push(`Ibotta cash back: ${money(cashBack)}`); if(points) bits.push(`Fetch: ${points.toLocaleString()} points`);
  el('rewardSummary').innerHTML = bits.map(x=>`<span>${x}</span>`).join('');
}
function getDealsEligible() {
  const store = el('store').value;
  if (store === 'Compare') return ['DG','Walmart','Kroger'].flatMap(eligibleForStore);
  return eligibleForStore(store);
}
function renderDeals() {
  const query = el('search').value.trim().toLowerCase();
  const deals = getDealsEligible().filter(p => !query || (p.name+' '+p.cat+' '+storeNames[p.store]).toLowerCase().includes(query)).sort((a,b) => itemSavingsPct(b)-itemSavingsPct(a));
  el('deals').innerHTML = deals.map(p => {
    const hist = historyComparison(p);
    const inCart=isInManualCart(p);
    const brand=brandType(p);
    const alts=alternativesFor(p);
    const bestAlt=alts[0];
    const cheaperAlt=bestAlt && netPrice(bestAlt)<netPrice(p)-0.009 ? bestAlt : null;
    return `<article class="deal-card deal-card-selectable">
      <div class="deal-card-top"><span class="store-badge">${storeNames[p.store]}</span><span class="brand-badge ${brand}">${brand==='store'?'Store brand':'Name brand'}</span></div>
      <h3>${esc(p.name)}</h3>
      <div class="save">${money(netPrice(p))}</div>
      <div class="meta">Shelf ${money(p.price)} · Checkout ${money(checkoutPrice(p))} · Net after rewards${hist ? ` · <strong>${hist}</strong>` : ''}</div>
      <div class="badges">${badges(p)}</div>
      <span class="pill">${Math.round(itemSavingsPct(p)*100)}% net savings</span>
      ${cheaperAlt?`<div class="cheaper-warning"><strong>Cheaper option found:</strong> ${esc(bestAlt.name)} at ${esc(storeNames[bestAlt.store])} is ${money(netPrice(p)-netPrice(bestAlt))} less after discounts.</div>`:''}
      <div class="deal-actions">
        <button type="button" class="${inCart?'selected-cart-button':'add-cart-button'}" data-add-deal="${esc(cartKey(p))}" ${inCart?'disabled':''}>${inCart?'✓ In Cart':'Add to Cart'}</button>
        ${alts.length?`<button type="button" class="secondary compare-deal-button" data-compare-deal="${esc(cartKey(p))}">Compare Options</button>`:''}
      </div>
      <div class="inline-compare" id="compare-${encodeURIComponent(cartKey(p))}" hidden>${renderAlternativeRows(p)}</div>
    </article>`;
  }).join('');
  el('deals').querySelectorAll('[data-add-deal]').forEach(btn=>btn.addEventListener('click',()=>{
    const p=products.find(x=>cartKey(x)===btn.dataset.addDeal); if(p) addDealToCart(p);
  }));
  el('deals').querySelectorAll('[data-compare-deal]').forEach(btn=>btn.addEventListener('click',()=>{
    const card=btn.closest('.deal-card'); const panel=card?.querySelector('.inline-compare');
    if(panel){panel.hidden=!panel.hidden; btn.textContent=panel.hidden?'Compare Options':'Hide Comparison';}
  }));
}

document.querySelectorAll('[data-budget]').forEach(btn => btn.addEventListener('click', () => { el('budget').value=btn.dataset.budget; buildCart(); }));
document.querySelectorAll('.need').forEach(box => box.addEventListener('change', () => { if(box.checked) el('anything').checked=false; renderDeals(); }));
el('anything').addEventListener('change', () => { if(el('anything').checked) document.querySelectorAll('.need').forEach(box=>box.checked=false); renderDeals(); });
['useIbotta','useFetch'].forEach(id => el(id).addEventListener('change', () => { if(cart.length) buildCart(); else renderDeals(); }));
el('store').addEventListener('change', () => { cart=[]; comparisonResults=[]; renderComparison(); renderCart(); renderDeals(); });
el('goal').addEventListener('change', buildCart); el('build').addEventListener('click', buildCart); el('clear').addEventListener('click', () => { cart=[]; comparisonResults=[]; renderComparison(); renderCart(); }); el('search').addEventListener('input', renderDeals);
recordPriceHistory(products,'bundled');
syncManualCart(); renderHistory();

if (el('clearHistory')) el('clearHistory').addEventListener('click', () => {
  if (confirm('Clear all price history saved on this device?')) { localStorage.removeItem(HISTORY_KEY); renderHistory(); renderDeals(); }
});

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
let lastRefreshAt = null;
let refreshTimer = null;

function formatRefreshTime(date) {
  return new Intl.DateTimeFormat(undefined, {hour:'numeric', minute:'2-digit', second:'2-digit'}).format(date);
}

function setFreshness(state, message) {
  const dot = el('freshnessDot');
  const status = el('freshnessStatus');
  const updated = el('lastUpdated');
  if (!dot || !status || !updated) return;
  dot.className = 'freshness-dot ' + state;
  status.textContent = message;
  updated.textContent = lastRefreshAt ? `Last checked ${formatRefreshTime(lastRefreshAt)} · auto-refresh every 5 min` : 'Waiting for first refresh';
}

async function refreshDealFeed({silent=false}={}) {
  const btn = el('refreshDeals');
  if (btn) { btn.disabled = true; btn.classList.add('refreshing'); }
  if (!silent) setFreshness('checking','Checking current deals…');
  try {
    // This endpoint is the handoff point for a live retailer/reward backend.
    // If it is not present yet, the app keeps the bundled deal set instead of pretending it changed.
    const response = await fetch(`/api/deals?ts=${Date.now()}&zip=${encodeURIComponent(getSharedZip()||'')}`, {cache:'no-store'});
    if (!response.ok) throw new Error(`Deal feed unavailable (${response.status})`);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.products)) throw new Error('Invalid deal feed');
    if (payload.products.length) products = payload.products;
    promotions = Array.isArray(payload.promotions) ? payload.promotions : [];
    sourceCoverage = payload.sources || null;
    recordPriceHistory(products,'live-refresh');
    renderPromotions(); renderSourceCoverage();
renderCouponPlan();
if(el('clearCouponPlan')) el('clearCouponPlan').addEventListener('click',()=>{ if(confirm('Clear all selected coupons and checkout results?')){ localStorage.removeItem(COUPON_PLAN_KEY); renderCouponPlan(); renderPromotions(); } });
    lastRefreshAt = new Date(payload.updatedAt || Date.now());
    const liveCount = (payload.products?.length||0) + (payload.promotions?.length||0);
    setFreshness(payload.live ? 'fresh' : 'limited', payload.live ? `Live sources checked · ${liveCount} records` : 'Live sources limited');
    syncManualCart();
  } catch (err) {
    lastRefreshAt = new Date();
    setFreshness('limited','Live feed not connected yet');
    if (!silent) console.warn(err);
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('refreshing'); }
  }
}

function startDealRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => refreshDealFeed({silent:true}), REFRESH_INTERVAL_MS);
}

if (el('refreshDeals')) el('refreshDeals').addEventListener('click', () => refreshDealFeed());
renderPromotions(); renderSourceCoverage();
renderCouponPlan();
if(el('clearCouponPlan')) el('clearCouponPlan').addEventListener('click',()=>{ if(confirm('Clear all selected coupons and checkout results?')){ localStorage.removeItem(COUPON_PLAN_KEY); renderCouponPlan(); renderPromotions(); } });
if (el('promotionStore')) el('promotionStore').addEventListener('change', renderPromotions);
setFreshness('checking','Checking live retailer sources…');
refreshDealFeed({silent:true});
startDealRefresh();


// --- Secure retailer account connections ---
async function loadKrogerConnection() {
  const note = el('krogerAccountNote');
  const actions = el('krogerAccountActions');
  const setup = el('krogerSetupNote');
  if (!note || !actions) return;
  try {
    const response = await fetch('/api/kroger/status', {cache:'no-store', credentials:'same-origin'});
    const data = await response.json();
    if (!data.configured) {
      note.textContent = 'Developer connection needs one-time setup';
      actions.innerHTML = '<a class="secondary button-link" href="https://developer.kroger.com" target="_blank" rel="noopener">Create Kroger developer app</a>';
      if (setup) {
        setup.hidden = false;
        setup.innerHTML = '<strong>One-time setup:</strong> register Coupon Game Plan with Kroger, then add <code>KROGER_CLIENT_ID</code>, <code>KROGER_CLIENT_SECRET</code> and <code>KROGER_SESSION_SECRET</code> in Vercel. Use <code>'+location.origin+'/api/kroger/callback</code> as the redirect URL.';
      }
      return;
    }
    if (setup) setup.hidden = true;
    if (data.connected) {
      note.textContent = data.profileId ? `Connected · profile ${String(data.profileId).slice(0,8)}…` : 'Connected securely';
      actions.innerHTML = '<button id="disconnectKroger" class="secondary" type="button">Disconnect</button>';
      const tools=el('krogerStoreTools'); if(tools) tools.hidden=false;
      restoreKrogerStore();
      const btn = el('disconnectKroger');
      if (btn) btn.addEventListener('click', async()=>{ await fetch('/api/kroger/logout',{method:'POST',credentials:'same-origin'}); loadKrogerConnection(); });
    } else {
      note.textContent = 'Not connected';
      actions.innerHTML = '<a class="primary mini-primary button-link" href="/api/kroger/connect">Connect Kroger</a>';
    }
  } catch (e) {
    note.textContent = 'Connection status unavailable';
    actions.innerHTML = '<button class="secondary" type="button" onclick="loadKrogerConnection()">Try again</button>';
  }
}
loadKrogerConnection();


const KROGER_STORE_KEY='couponGamePlan.krogerStore.v1';
function selectedKrogerStore(){ try{return JSON.parse(localStorage.getItem(KROGER_STORE_KEY)||'null')}catch{return null} }
function restoreKrogerStore(){
  const s=selectedKrogerStore(), status=el('krogerStoreStatus');
  if(s&&status) status.textContent=`Using ${s.name} · ${s.address||''}`;
}
async function findKrogerStores(){
  const zip=(el('krogerZip')?.value||'').replace(/\D/g,'');
  const status=el('krogerStoreStatus'), select=el('krogerStoreSelect');
  if(zip.length!==5){ if(status) status.textContent='Enter a 5-digit ZIP code.'; return; }
  status.textContent='Finding nearby Kroger stores…';
  try{
    const r=await fetch(`/api/kroger/locations?zip=${encodeURIComponent(zip)}`,{cache:'no-store',credentials:'same-origin'});
    const data=await r.json(); if(!r.ok) throw new Error(data.error||'Store lookup failed');
    const rows=Array.isArray(data.data)?data.data:[];
    if(!rows.length){status.textContent='No Kroger-owned stores found nearby.';select.hidden=true;return}
    select.innerHTML='<option value="">Choose a store…</option>'+rows.map(x=>{
      const a=x.address||{}; const addr=[a.addressLine1,a.city,a.state,a.zipCode].filter(Boolean).join(', ');
      return `<option value="${x.locationId}" data-name="${(x.name||x.chain||'Kroger').replace(/"/g,'&quot;')}" data-address="${addr.replace(/"/g,'&quot;')}">${x.name||x.chain||'Kroger'} — ${addr}</option>`;
    }).join('');
    select.hidden=false; status.textContent=`Found ${rows.length} nearby locations.`;
  }catch(e){status.textContent=e.message}
}
async function chooseKrogerStore(){
  const select=el('krogerStoreSelect'), opt=select?.selectedOptions?.[0]; if(!opt?.value)return;
  const s={locationId:opt.value,name:opt.dataset.name||'Kroger',address:opt.dataset.address||''};
  localStorage.setItem(KROGER_STORE_KEY,JSON.stringify(s));
  el('krogerStoreStatus').textContent=`Using ${s.name} · ${s.address}`;
  await loadKrogerLivePrices();
}
function krogerProductToApp(x,cat){
  const item=(x.items||[])[0]||{}, price=item.price||{}, regular=Number(price.regular||0), promo=Number(price.promo||0);
  const sale=promo>0?promo:regular;
  if(!regular&&!sale)return null;
  const imgs=Array.isArray(x.images)?x.images:[], preferred=imgs.find(i=>i.perspective==='front')||imgs[0]||{}, sizes=Array.isArray(preferred.sizes)?preferred.sizes:[], im=(sizes.find(s=>/large|medium/i.test(s.size))||sizes[0]||{}).url||preferred.url||null;
  return {store:'Kroger',name:x.description||x.brand||'Kroger item',cat,price:regular||sale,sale:sale||regular,coupon:0,ibotta:0,fetch:0,upc:x.upc||x.productId,source:'Kroger API',live:true,imageUrl:im,description:[x.brand,item.size].filter(Boolean).join(' · ')};
}
async function loadKrogerLivePrices(){
  const s=selectedKrogerStore(); if(!s)return;
  const groups=[['milk','Food'],['eggs','Food'],['bread','Food'],['pasta','Food'],['cereal','Food'],['water','Drinks'],['soda','Drinks'],['laundry detergent','Laundry'],['paper towels','Paper'],['toilet paper','Paper'],['dish soap','Cleaning']];
  const results=await Promise.allSettled(groups.map(async([term,cat])=>{
    const r=await fetch(`/api/kroger/products?term=${encodeURIComponent(term)}&locationId=${encodeURIComponent(s.locationId)}`,{cache:'no-store',credentials:'same-origin'});
    const d=await r.json(); if(!r.ok)throw new Error(d.error||term);
    return (d.data||[]).map(x=>krogerProductToApp(x,cat)).filter(Boolean);
  }));
  const live=results.filter(x=>x.status==='fulfilled').flatMap(x=>x.value);
  if(live.length){
    products=products.filter(p=>p.store!=='Kroger').concat(live);
    recordPriceHistory(live,'kroger-api');
    renderDeals(); if(cart.length) buildCart();
    const st=el('krogerStoreStatus'); if(st) st.textContent=`Using ${s.name} · loaded ${live.length} live-priced Kroger items`;
  }
}
if(el('findKrogerStores')) el('findKrogerStores').addEventListener('click',findKrogerStores);
if(el('krogerStoreSelect')) el('krogerStoreSelect').addEventListener('change',chooseKrogerStore);


const SHARED_ZIP_KEY='couponGamePlan.sharedZip.v1';

function getSharedZip(){
  return (localStorage.getItem(SHARED_ZIP_KEY)||'').replace(/\D/g,'');
}
function setSharedZip(zip){
  localStorage.setItem(SHARED_ZIP_KEY,zip);
}
function renderNearestStoreCard(key,store){
  const names={dg:'Dollar General',walmart:'Walmart',kroger:'Kroger'};
  const title=names[key]||store?.name||key;
  const address=store?.address||'Finding nearest store…';
  return `<div class="nearest-store-card"><strong>${title}</strong><div class="meta">${address}</div></div>`;
}
async function resolveNearestKroger(zip){
  try{
    const r=await fetch(`/api/kroger/locations?zip=${encodeURIComponent(zip)}`,{cache:'no-store',credentials:'same-origin'});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||'Kroger lookup failed');
    const rows=Array.isArray(data.data)?data.data:[];
    if(!rows.length) return null;
    const x=rows[0], a=x.address||{};
    const address=[a.addressLine1,a.city,a.state,a.zipCode].filter(Boolean).join(', ');
    const store={locationId:x.locationId,name:x.name||x.chain||'Kroger',address};
    localStorage.setItem(KROGER_STORE_KEY,JSON.stringify(store));
    restoreKrogerStore();
    return store;
  }catch{
    return null;
  }
}
async function applySharedZip(){
  const input=el('sharedZip'), status=el('sharedLocationStatus'), box=el('nearestStores');
  const zip=(input?.value||'').replace(/\D/g,'');
  if(zip.length!==5){ if(status) status.textContent='Enter a 5-digit ZIP code.'; return; }
  setSharedZip(zip);
  status.textContent=`Using ${zip} for Dollar General, Walmart, and Kroger. Finding nearest stores…`;
  box.innerHTML=['dg','walmart','kroger'].map(k=>renderNearestStoreCard(k,null)).join('');
  try{
    const [all,kroger]=await Promise.all([
      fetch(`/api/locations?zip=${encodeURIComponent(zip)}`,{cache:'no-store'}).then(async r=>{const d=await r.json(); if(!r.ok)throw new Error(d.error||'Location lookup failed'); return d}),
      resolveNearestKroger(zip)
    ]);
    if(kroger) all.stores.kroger={name:kroger.name,address:kroger.address,verified:true};
    box.innerHTML=['dg','walmart','kroger'].map(k=>renderNearestStoreCard(k,all.stores?.[k])).join('');
    status.textContent=`Using ZIP ${zip}. The nearest available store for each retailer will be used automatically.`;
    await refreshDealFeed();
    if(kroger) await loadKrogerLivePrices();
  }catch(e){
    status.textContent=`ZIP ${zip} saved. ${e.message||'Some store locations could not be confirmed.'}`;
    await refreshDealFeed();
  }
}
function restoreSharedZip(){
  const zip=getSharedZip(), input=el('sharedZip');
  if(zip && input){
    input.value=zip;
    applySharedZip();
  }
}
if(el('applySharedZip')) el('applySharedZip').addEventListener('click',applySharedZip);
if(el('sharedZip')) el('sharedZip').addEventListener('keydown',e=>{if(e.key==='Enter')applySharedZip()});
setTimeout(restoreSharedZip,50);


const CURRENT_LOCATION_KEY='couponGamePlan.currentLocation.v1';

function saveCurrentLocation(lat,lon){
  localStorage.setItem(CURRENT_LOCATION_KEY,JSON.stringify({lat,lon,savedAt:Date.now()}));
}
function getCurrentLocation(){
  try{return JSON.parse(localStorage.getItem(CURRENT_LOCATION_KEY)||'null')}catch{return null}
}
async function nearestKrogerByCoords(lat,lon){
  try{
    const r=await fetch(`/api/kroger/locations?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,{cache:'no-store',credentials:'same-origin'});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||'Kroger lookup failed');
    const rows=Array.isArray(data.data)?data.data:[];
    if(!rows.length)return null;
    const x=rows[0],a=x.address||{};
    const addr=[a.addressLine1,a.city,a.state,a.zipCode].filter(Boolean).join(', ');
    const store={locationId:x.locationId,name:x.name||x.chain||'Kroger',address:addr};
    localStorage.setItem(KROGER_STORE_KEY,JSON.stringify(store));
    restoreKrogerStore();
    return store;
  }catch{return null}
}
function geoStoreCard(name,s){
  if(!s) return `<div class="nearest-store-card"><strong>${name}</strong><div class="meta">No nearby store could be verified.</div></div>`;
  return `<div class="nearest-store-card"><strong>${s.name||name}</strong><div class="meta">${s.address||'Address unavailable'}</div>${Number.isFinite(s.distanceMiles)?`<div class="distance">${s.distanceMiles} miles away</div>`:''}</div>`;
}
async function useCurrentLocation(){
  const btn=el('useCurrentLocation'),status=el('sharedLocationStatus'),box=el('nearestStores');
  if(!navigator.geolocation){
    status.textContent='This browser does not support location access. Use ZIP instead.';
    return;
  }
  btn.classList.add('location-working'); btn.textContent='Finding Your Location…';
  status.textContent='Waiting for location permission…';
  navigator.geolocation.getCurrentPosition(async pos=>{
    const lat=pos.coords.latitude,lon=pos.coords.longitude;
    saveCurrentLocation(lat,lon);
    localStorage.removeItem(SHARED_ZIP_KEY);
    status.textContent='Location found. Finding the nearest stores…';
    box.innerHTML=['Dollar General','Walmart','Kroger'].map(n=>geoStoreCard(n,null)).join('');
    try{
      const [publicStores,kroger]=await Promise.all([
        fetch(`/api/nearby-stores?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,{cache:'no-store'}).then(r=>r.json()),
        nearestKrogerByCoords(lat,lon)
      ]);
      box.innerHTML=
        geoStoreCard('Dollar General',publicStores?.stores?.dg)+
        geoStoreCard('Walmart',publicStores?.stores?.walmart)+
        geoStoreCard('Kroger',kroger);
      status.textContent='Using your current location. These nearest stores will be used for shopping comparisons.';
      await refreshDealFeed();
      if(kroger) await loadKrogerLivePrices();
    }catch(e){
      status.textContent='Your location was saved, but some nearby stores could not be verified right now.';
    }finally{
      btn.classList.remove('location-working');btn.textContent='Use My Current Location';
    }
  },err=>{
    const messages={
      1:'Location permission was denied. You can still use ZIP.',
      2:'Your location could not be determined. You can still use ZIP.',
      3:'Location lookup timed out. Try again or use ZIP.'
    };
    status.textContent=messages[err.code]||'Could not get your location. Use ZIP instead.';
    btn.classList.remove('location-working');btn.textContent='Use My Current Location';
  },{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
}
if(el('useCurrentLocation')) el('useCurrentLocation').addEventListener('click',useCurrentLocation);
