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
function promotionTiming(p){
  if(!p.couponEnd) return ''; const d=daysUntil(p.couponEnd);
  if(d===null) return ''; if(d<0) return `Expired ${shortDate(p.couponEnd)}`; if(d===0) return 'Expires today'; if(d===1) return 'Expires tomorrow'; return `Expires ${shortDate(p.couponEnd)} · ${d} days left`;
}
function renderPromotions(){
  const box=el('promotions'); if(!box) return; const filter=el('promotionStore')?.value||'All';
  const rows=promotions.filter(p=>(filter==='All'||p.store===filter)&&(!p.couponEnd||daysUntil(p.couponEnd)>=0)).sort((a,b)=>{ const ad=daysUntil(a.couponEnd), bd=daysUntil(b.couponEnd); return (ad??9999)-(bd??9999); });
  if(!rows.length){ box.innerHTML='<div class="empty-state">No live promotions were readable from the selected source on this refresh.</div>'; return; }
  box.innerHTML=rows.map(p=>`<article class="promotion-card"><div><span class="store-badge">${storeNames[p.store]||p.store}</span><span class="badge coupon">${p.type||'Offer'}</span></div><h3>${p.title}</h3>${p.amount?`<div class="save">${money(p.amount)} value</div>`:''}<p class="meta">${p.details||''}</p>${promotionTiming(p)?`<span class="badge expiry ${daysUntil(p.couponEnd)<=2?'urgent':''}">${promotionTiming(p)}</span>`:''}${p.sourceUrl?`<a class="source-link" href="${p.sourceUrl}" target="_blank" rel="noopener">Official source</a>`:''}</article>`).join('');
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
      <ol class="compare-items">${r.items.slice(0,5).map(p => `<li>${p.name} — ${money(netPrice(p))} net</li>`).join('') || '<li>No matching items fit the budget.</li>'}</ol>
    </article>`).join('');
}
function renderCart() {
  const cartEl = el('cart');
  cartEl.innerHTML = '';
  if (!cart.length) { cartEl.innerHTML = '<div class="empty-state">No items fit your current filters and budget.</div>'; updateSummary(); return; }
  cart.forEach(p => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    const saleLabel = p.store === 'Walmart' && p.rollback ? 'Rollback' : 'Sale';
    row.innerHTML = `<div><span class="store-badge">${storeNames[p.store]}</span><h3>${p.name}</h3><div class="meta">Shelf ${money(p.price)} · ${saleLabel} ${money(p.sale)} · Checkout ${money(checkoutPrice(p))}</div><div class="badges">${badges(p)}</div></div><div class="price-block"><strong>${money(netPrice(p))}</strong><small>Net after cash back</small></div>`;
    cartEl.appendChild(row);
  });
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
    return `<article class="deal-card"><span class="store-badge">${storeNames[p.store]}</span><h3>${p.name}</h3><div class="save">${money(netPrice(p))}</div><div class="meta">Checkout ${money(checkoutPrice(p))} · Net after rewards${hist ? ` · <strong>${hist}</strong>` : ''}</div><div class="badges">${badges(p)}</div><span class="pill">${Math.round(itemSavingsPct(p)*100)}% net savings</span></article>`;
  }).join('');
}

document.querySelectorAll('[data-budget]').forEach(btn => btn.addEventListener('click', () => { el('budget').value=btn.dataset.budget; buildCart(); }));
document.querySelectorAll('.need').forEach(box => box.addEventListener('change', () => { if(box.checked) el('anything').checked=false; renderDeals(); }));
el('anything').addEventListener('change', () => { if(el('anything').checked) document.querySelectorAll('.need').forEach(box=>box.checked=false); renderDeals(); });
['useIbotta','useFetch'].forEach(id => el(id).addEventListener('change', () => { if(cart.length) buildCart(); else renderDeals(); }));
el('store').addEventListener('change', () => { cart=[]; comparisonResults=[]; renderComparison(); renderCart(); renderDeals(); });
el('goal').addEventListener('change', buildCart); el('build').addEventListener('click', buildCart); el('clear').addEventListener('click', () => { cart=[]; comparisonResults=[]; renderComparison(); renderCart(); }); el('search').addEventListener('input', renderDeals);
recordPriceHistory(products,'bundled');
renderDeals(); renderCart(); renderHistory();

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
    const response = await fetch(`/api/deals?ts=${Date.now()}`, {cache:'no-store'});
    if (!response.ok) throw new Error(`Deal feed unavailable (${response.status})`);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.products)) throw new Error('Invalid deal feed');
    if (payload.products.length) products = payload.products;
    promotions = Array.isArray(payload.promotions) ? payload.promotions : [];
    sourceCoverage = payload.sources || null;
    recordPriceHistory(products,'live-refresh');
    renderPromotions(); renderSourceCoverage();
    lastRefreshAt = new Date(payload.updatedAt || Date.now());
    const liveCount = (payload.products?.length||0) + (payload.promotions?.length||0);
    setFreshness(payload.live ? 'fresh' : 'limited', payload.live ? `Live sources checked · ${liveCount} records` : 'Live sources limited');
    if (cart.length) buildCart(); else { renderDeals(); renderCart(); }
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
