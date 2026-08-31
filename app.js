const products = [
  {store:'DG',name:'Tide Liquid Detergent',cat:'Laundry',price:15.95,sale:15.95,coupon:3.00},
  {store:'DG',name:'Gain Laundry Care',cat:'Laundry',price:10.95,sale:10.00,coupon:2.00},
  {store:'DG',name:'Angel Soft Toilet Paper',cat:'Paper',price:8.95,sale:7.95,coupon:1.50},
  {store:'DG',name:'Sparkle Paper Towels',cat:'Paper',price:7.50,sale:6.75,coupon:1.00},
  {store:'DG',name:'Mtn Dew 12 Pack',cat:'Drinks',price:8.00,sale:7.00,coupon:2.00},
  {store:'DG',name:'Gatorade Multipack',cat:'Drinks',price:8.50,sale:7.50,coupon:1.50},
  {store:'DG',name:'Dixie Plates',cat:'Household',price:6.50,sale:5.50,coupon:1.50},
  {store:'DG',name:'Febreze Air',cat:'Cleaning',price:4.00,sale:4.00,coupon:2.00},
  {store:'DG',name:'Cap’n Crunch Cereal',cat:'Food',price:4.00,sale:3.50,coupon:1.00},
  {store:'DG',name:'White Castle Sliders',cat:'Food',price:6.25,sale:5.75,coupon:0.50},

  {store:'Walmart',name:'Great Value Eggs 12 ct',cat:'Food',price:2.48,sale:2.48,coupon:0},
  {store:'Walmart',name:'Great Value Bread',cat:'Food',price:1.42,sale:1.42,coupon:0},
  {store:'Walmart',name:'Great Value Water 24 Pack',cat:'Drinks',price:3.68,sale:3.68,coupon:0},
  {store:'Walmart',name:'Tide Liquid Detergent',cat:'Laundry',price:15.94,sale:15.94,coupon:2.00},
  {store:'Walmart',name:'Great Value Paper Towels',cat:'Paper',price:7.48,sale:7.48,coupon:0},
  {store:'Walmart',name:'Great Value Dish Soap',cat:'Cleaning',price:2.18,sale:2.18,coupon:0},

  {store:'Kroger',name:'Kroger Eggs 12 ct',cat:'Food',price:1.99,sale:1.99,coupon:0},
  {store:'Kroger',name:'Kroger Pasta',cat:'Food',price:1.49,sale:0.99,coupon:0},
  {store:'Kroger',name:'Kroger Milk Gallon',cat:'Food',price:3.29,sale:3.29,coupon:0},
  {store:'Kroger',name:'Tide Liquid Detergent',cat:'Laundry',price:16.49,sale:14.99,coupon:2.00},
  {store:'Kroger',name:'Kroger Soft Drinks 12 Pack',cat:'Drinks',price:5.99,sale:4.99,coupon:0},
  {store:'Kroger',name:'Kroger Paper Towels',cat:'Paper',price:7.99,sale:6.99,coupon:1.00}
];

const el = id => document.getElementById(id);
const money = n => '$' + Math.max(0, n || 0).toFixed(2);
const finalPrice = p => Math.max(0, p.sale - p.coupon);
const itemSavings = p => Math.max(0, p.price - finalPrice(p));
const itemSavingsPct = p => p.price ? itemSavings(p) / p.price : 0;

let cart = [];

function selectedNeeds() {
  if (el('anything').checked) return [];
  return [...document.querySelectorAll('.need:checked')].map(x => x.value);
}

function scoreProduct(p, goal) {
  if (goal === 'save') return itemSavings(p);
  if (goal === 'oop') return 1 / Math.max(0.01, finalPrice(p));
  return (itemSavingsPct(p) * 3) + (itemSavings(p) / Math.max(1, finalPrice(p)));
}

function getEligible() {
  const store = el('store').value;
  const needs = selectedNeeds();
  return products.filter(p => p.store === store && (!needs.length || needs.includes(p.cat)));
}

function buildCart() {
  let budget = Number(el('budget').value);
  if (!Number.isFinite(budget) || budget <= 0) {
    budget = 25;
    el('budget').value = '25';
  }

  const goal = el('goal').value;
  const candidates = getEligible().slice().sort((a,b) => scoreProduct(b, goal) - scoreProduct(a, goal));

  let remaining = budget;
  const chosen = [];

  for (const p of candidates) {
    const cost = finalPrice(p);
    if (cost <= remaining + 0.0001) {
      chosen.push(p);
      remaining -= cost;
    }
  }

  cart = chosen;
  renderCart();
  renderDeals();
}

function renderCart() {
  const cartEl = el('cart');
  cartEl.innerHTML = '';

  if (!cart.length) {
    cartEl.innerHTML = '<div class="empty-state">No items fit your current filters and budget.</div>';
    updateSummary();
    return;
  }

  cart.forEach((p, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const left = document.createElement('div');
    left.innerHTML = `
      <h3>${p.name}</h3>
      <div class="meta">Shelf ${money(p.price)} · Sale ${money(p.sale)} · Coupon ${money(p.coupon)}</div>
    `;

    const right = document.createElement('div');
    right.className = 'price-block';
    right.innerHTML = `
      <strong>${money(finalPrice(p))}</strong>
      <small>Save ${money(itemSavings(p))}</small>
    `;

    row.append(left, right);
    cartEl.appendChild(row);
  });

  updateSummary();
}

function updateSummary() {
  const retail = cart.reduce((s,p) => s + p.price, 0);
  let pay = cart.reduce((s,p) => s + finalPrice(p), 0);

  // Simple demo logic for DG $5 off $25: apply only when the selected
  // cart's pre-coupon sale subtotal reaches $25.
  if (el('store').value === 'DG') {
    const dgSaleSubtotal = cart.reduce((s,p) => s + p.sale, 0);
    if (dgSaleSubtotal >= 25) pay = Math.max(0, pay - 5);
  }

  const save = Math.max(0, retail - pay);
  const rate = retail ? (save / retail) * 100 : 0;

  el('retail').textContent = money(retail);
  el('pay').textContent = money(pay);
  el('save').textContent = money(save);
  el('rate').textContent = Math.round(rate) + '%';

  const storeName = el('store').options[el('store').selectedIndex].text;
  el('summaryText').textContent = cart.length
    ? `Best current demo plan for ${storeName}: ${cart.length} items, ${money(retail)} shelf value, estimated ${money(pay)} out-of-pocket, saving about ${money(save)}.`
    : 'Choose a store and budget, then build your cart.';
}

function renderDeals() {
  const query = el('search').value.trim().toLowerCase();
  const deals = getEligible()
    .filter(p => !query || (p.name + ' ' + p.cat).toLowerCase().includes(query))
    .sort((a,b) => itemSavingsPct(b) - itemSavingsPct(a));

  const container = el('deals');
  container.innerHTML = '';

  deals.forEach(p => {
    const card = document.createElement('article');
    card.className = 'deal-card';
    card.innerHTML = `
      <h3>${p.name}</h3>
      <div class="save">${money(finalPrice(p))}</div>
      <div class="meta">Shelf ${money(p.price)} · Save ${money(itemSavings(p))}</div>
      <span class="pill">${Math.round(itemSavingsPct(p) * 100)}% savings</span>
    `;
    container.appendChild(card);
  });
}

document.querySelectorAll('[data-budget]').forEach(btn => {
  btn.addEventListener('click', () => {
    el('budget').value = btn.dataset.budget;
    buildCart();
  });
});

document.querySelectorAll('.need').forEach(box => {
  box.addEventListener('change', () => {
    if (box.checked) el('anything').checked = false;
    renderDeals();
  });
});

el('anything').addEventListener('change', () => {
  if (el('anything').checked) {
    document.querySelectorAll('.need').forEach(box => box.checked = false);
  }
  renderDeals();
});

el('store').addEventListener('change', () => {
  cart = [];
  renderCart();
  renderDeals();
});

el('goal').addEventListener('change', buildCart);
el('build').addEventListener('click', buildCart);
el('clear').addEventListener('click', () => {
  cart = [];
  renderCart();
});
el('search').addEventListener('input', renderDeals);

renderDeals();
renderCart();
