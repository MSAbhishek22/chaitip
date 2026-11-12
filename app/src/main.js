// ChaiTip — UI wiring. All network/BCH work lives in wallet.js; all pure
// math/validation lives in bch.js. This file only touches the DOM.
import QRCode from 'qrcode';
import {
  PRESET_TIPS_INR, FALLBACK_RATE_INR_PER_BCH, FALLBACK_RATE_AS_OF,
  inrToSats, satsToBch, satsToInr, formatInr, validateCustomAmount,
  validateStall, buildReceipt, stallLink, shortTxid,
} from './bch.js';
import {
  isValidAddress, startPairing, deriveReceiveAddress, fetchUtxos,
  buildWcTransaction, createDemoWallet, sendDemoTip, verifyTipByTxid,
} from './wallet.js';

const $ = (id) => document.getElementById(id);
const DEMO_STALLS = [
  { id: 'demo-ramesh', name: 'Ramesh Chai', tagline: 'Cutting chai since 2009', location: 'Meerut', demo: true },
  { id: 'demo-sharma', name: 'Sharma Ji Ki Chai', tagline: 'Adrak wali, extra kadak', location: 'Delhi', demo: true },
  { id: 'demo-anna', name: 'Auto Anna', tagline: 'Meter down, chai up', location: 'Bengaluru', demo: true },
];
const FAUCET_URL = 'https://faucet.bitcoin.com/';

// ---- state ---------------------------------------------------------------
let stalls = loadStalls();
let current = null;           // active stall object
let mode = 'live';            // 'live' | 'demo'
let selectedInr = 10;
let rate = { inrPerBch: FALLBACK_RATE_INR_PER_BCH, live: false, asOf: FALLBACK_RATE_AS_OF };
let pairing = null;           // WizardConnect session
let connectedAddress = null;  // tipper address from wallet session
let demoWallet = null;        // { wallet, address }
let demoTill = {};            // stallId -> testnet address (session-only)
let scene = null;             // 3D controller

function loadStalls() {
  try { return JSON.parse(localStorage.getItem('chaitip:stalls') || '[]'); } catch { return []; }
}
function saveStalls() { localStorage.setItem('chaitip:stalls', JSON.stringify(stalls)); }
function feedKey(id) { return `chaitip:feed:${id}`; }
function loadFeed(id) { try { return JSON.parse(localStorage.getItem(feedKey(id)) || '[]'); } catch { return []; } }
function saveFeed(id, feed) { localStorage.setItem(feedKey(id), JSON.stringify(feed)); }

// ---- rate -----------------------------------------------------------------
async function refreshRate() {
  const line = $('rate-line');
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-cash&vs_currencies=inr');
    const j = await res.json();
    const r = j?.['bitcoin-cash']?.inr;
    if (Number.isFinite(r) && r > 0) {
      rate = { inrPerBch: r, live: true, asOf: new Date().toISOString() };
      line.textContent = `Live rate: 1 BCH = ${formatInr(r)} (CoinGecko, just now)`;
    } else throw new Error('bad rate payload');
  } catch {
    rate = { inrPerBch: FALLBACK_RATE_INR_PER_BCH, live: false, asOf: FALLBACK_RATE_AS_OF };
    line.textContent = `Rate feed unreachable — using labelled fallback 1 BCH = ${formatInr(FALLBACK_RATE_INR_PER_BCH)} (as of ${FALLBACK_RATE_AS_OF}).`;
  }
  updateAmountLine();
}

function updateAmountLine() {
  const sats = (() => { try { return inrToSats(selectedInr, rate.inrPerBch); } catch { return null; } })();
  $('amount-line').innerHTML = sats == null
    ? ''
    : `${formatInr(selectedInr)} = <strong>${satsToBch(sats)} BCH</strong> <small>(${sats.toLocaleString('en-IN')} sats${rate.live ? '' : ' · fallback rate'})</small>`;
  const tipBtn = $('tip-btn');
  tipBtn.textContent = mode === 'demo' ? `Tip ${formatInr(selectedInr)} (demo testnet)` : `Tip ${formatInr(selectedInr)}`;
}

// ---- stall rendering -------------------------------------------------------
function showStall(stall) {
  current = stall;
  $('stall-name').textContent = stall.name;
  $('stall-meta').textContent = `${stall.location}${stall.tagline ? ' · ' + stall.tagline : ''}`;
  $('stall-address').textContent = stall.address ? stall.address : '';
  $('demo-note').hidden = !stall.demo;
  $('pay-address').textContent = stall.address || '(demo stall — address is created when you tip in demo mode)';
  renderFeed();
  renderReceipts();
  renderPayQr();
  updateTipButton();
  history.replaceState(null, '', stallLink(location.origin + location.pathname, stall.id).replace(location.origin, '') || `?stall=${stall.id}`);
}

function renderPayQr() {
  const canvas = $('pay-qr');
  if (!current?.address) { canvas.getContext('2d').clearRect(0, 0, 160, 160); return; }
  QRCode.toCanvas(canvas, current.address, { width: 160, margin: 1 }).catch(() => {});
}

function renderFeed() {
  const feed = loadFeed(current.id);
  const ul = $('tip-feed');
  ul.innerHTML = '';
  $('feed-empty').hidden = feed.length > 0;
  feed.slice(0, 20).forEach((t) => {
    const li = document.createElement('li');
    const when = new Date(t.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    li.innerHTML = `<span class="amt">${formatInr(t.amountInr)} · ${satsToBch(t.sats)} BCH</span><span class="when">${when} · ${t.status}</span>${t.txid ? `<span class="tx">${shortTxid(t.txid)}</span>` : ''}`;
    ul.appendChild(li);
  });
  updateGlassCount(feed.filter((t) => t.status === 'confirmed').length);
}

function renderReceipts() {
  const feed = loadFeed(current.id).filter((t) => t.txid);
  const list = $('receipt-list');
  list.innerHTML = '';
  $('receipt-empty').hidden = feed.length > 0;
  feed.slice(0, 5).forEach((t) => {
    const r = buildReceipt({ txid: t.txid, sats: t.sats, feeSats: t.feeSats ?? null, rateInrPerBch: rate.inrPerBch, vendorName: current.name, timestamp: t.ts, network: t.network });
    const div = document.createElement('div');
    div.className = 'ticket';
    div.id = `receipt-${t.txid}`;
    div.innerHTML = `<h3>ChaiTip receipt</h3>
      <div>${current.name} · ${current.location}</div>
      <div class="tear"></div>
      <dl>
        <dt>Amount</dt><dd>${r.amountInr} (${r.amountBch} BCH)</dd>
        <dt>Fee</dt><dd>${r.feeBch ? `${r.feeBch} BCH (${r.feeInr})` : 'paid by wallet'}</dd>
        <dt>TxID</dt><dd>${r.txid}</dd>
        <dt>Time</dt><dd>${new Date(r.timestamp).toLocaleString('en-IN')}</dd>
        <dt>Network</dt><dd>${r.network}</dd>
      </dl>
      <a href="${r.explorerUrl}" target="_blank" rel="noopener">View on explorer ↗</a><br>
      <span class="stamp ${t.status === 'confirmed' ? '' : 'pending'}">${t.status === 'confirmed' ? 'CONFIRMED' : 'SENT · UNCONFIRMED'}</span>`;
    list.appendChild(div);
  });
}

function recordTip(tip) {
  const feed = loadFeed(current.id);
  feed.unshift(tip);
  saveFeed(current.id, feed);
  renderFeed();
  renderReceipts();
  if (tip.status === 'confirmed' && scene) scene.dropCoin(tip.txid);
}

// ---- 3D glass --------------------------------------------------------------
async function initGlass() {
  const canvas = $('scene');
  try {
    const { initScene } = await import('./scene.js');
    scene = initScene(canvas, { onCoinClick: (txid) => {
      const el = document.getElementById(`receipt-${txid}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } });
    const confirmed = loadFeed(current.id).filter((t) => t.status === 'confirmed');
    scene.setCoinCount(confirmed.length, confirmed.map((t) => t.txid));
  } catch {
    canvas.hidden = true;
    $('scene-fallback').hidden = false;
  }
}
function updateGlassCount(n) {
  if (scene) scene.setCoinCount(n);
  else $('fallback-count').textContent = `${n} tip${n === 1 ? '' : 's'} today`;
}

// ---- stepper ----------------------------------------------------------------
function setStep(step, state) {
  document.querySelectorAll('#stepper li').forEach((li) => {
    if (li.dataset.step === step) li.className = state;
    else if (state === 'active' && li.dataset.step < step) { /* keep */ }
  });
}
function resetStepper() {
  document.querySelectorAll('#stepper li').forEach((li) => { li.className = ''; });
}

// ---- live tip flow -----------------------------------------------------------
async function tipLive() {
  const err = $('tip-error');
  err.hidden = true;
  if (!pairing || !connectedAddress) { err.textContent = 'Connect your wallet first.'; err.hidden = false; return; }
  if (!current.address) { err.textContent = 'This stall has no BCH address yet.'; err.hidden = false; return; }
  const sats = inrToSats(selectedInr, rate.inrPerBch);
  const btn = $('tip-btn');
  btn.disabled = true; btn.textContent = 'Building your tip…';
  try {
    setStep('sign', 'active');
    const utxos = await fetchUtxos(connectedAddress, 'mainnet');
    const built = buildWcTransaction({ utxos, fromAddress: connectedAddress, toCashaddr: current.address, sats });
    const { signedTransaction, txid } = await pairing.requestSignature(built.wcRequest, built.inputPaths);
    setStep('sign', 'done'); setStep('broadcast', 'active');
    if (!txid) throw new Error('Wallet signed but returned no transaction ID. Check your wallet history — the tip may still have gone through.');
    setStep('broadcast', 'done');
    recordTip({ amountInr: selectedInr, sats, txid, feeSats: built.feeSats, status: 'confirmed', ts: new Date().toISOString(), network: 'mainnet' });
    btn.textContent = 'Tipped! 🎉';
    setTimeout(() => { btn.disabled = false; updateAmountLine(); }, 3000);
  } catch (e) {
    setStep('sign', 'failed');
    err.textContent = `Tip did not go through: ${e.message}`;
    err.hidden = false;
    btn.disabled = false; updateAmountLine();
  }
}

// ---- demo tip flow -------------------------------------------------------------
async function tipDemo() {
  const err = $('tip-error');
  err.hidden = true;
  const sats = inrToSats(selectedInr, rate.inrPerBch);
  const btn = $('tip-btn');
  btn.disabled = true; btn.textContent = 'Preparing demo tip…';
  try {
    if (!demoWallet) {
      demoWallet = await createDemoWallet();
      err.innerHTML = `Demo wallet created (testnet): <span class="mono">${demoWallet.address}</span>. It starts empty — fund it from a <a href="${FAUCET_URL}" target="_blank" rel="noopener">BCH testnet faucet</a>, then tap Tip again.`;
      err.hidden = false;
      btn.disabled = false; updateAmountLine();
      return;
    }
    if (!demoTill[current.id]) {
      const till = await createDemoWallet();
      demoTill[current.id] = till.address;
      current.address = till.address;
      $('stall-address').textContent = till.address;
      $('pay-address').textContent = till.address;
      renderPayQr();
    }
    const { txid } = await sendDemoTip(demoWallet.wallet, demoTill[current.id], sats);
    if (!txid) throw new Error('Testnet send returned no txid.');
    recordTip({ amountInr: selectedInr, sats, txid, feeSats: null, status: 'confirmed', ts: new Date().toISOString(), network: 'testnet' });
    btn.textContent = 'Demo tip sent! 🎉';
    setTimeout(() => { btn.disabled = false; updateAmountLine(); }, 3000);
  } catch (e) {
    err.textContent = `Demo tip did not go through: ${e.message}`;
    err.hidden = false;
    btn.disabled = false; updateAmountLine();
  }
}

// ---- connect (WizardConnect) ---------------------------------------------------
async function connectWallet() {
  const panel = $('pair-panel');
  const status = $('pair-status');
  const btn = $('connect-btn');
  if (pairing) return;
  panel.hidden = false;
  resetStepper();
  setStep('pair', 'active');
  status.textContent = 'Starting secure pairing… (this uses the real WizardConnect SDK; the live wallet handshake is awaiting its first real-phone test)';
  btn.disabled = true;
  try {
    pairing = startPairing((s) => {
      if (s?.stage === 'keyexchange') { setStep('pair', 'done'); setStep('approve', 'active'); status.textContent = s.detail; }
    });
    await QRCode.toCanvas($('pair-qr'), pairing.qrUri, { width: 180, margin: 1 });
    status.textContent = 'Scan this QR with Paytaca or Selene (WizardConnect). Waiting…';
    const session = await pairing.waitForSession();
    setStep('approve', 'done');
    const receive = session.paths.find((p) => p.name === 'receive') || session.paths[0];
    connectedAddress = deriveReceiveAddress(receive.xpub, 'mainnet');
    status.textContent = `Connected: ${connectedAddress.slice(0, 20)}… — ready to tip. (Address derived from your wallet's xpub; ChaiTip never sees your keys.)`;
    btn.textContent = 'Wallet connected ✓';
    updateTipButton();
  } catch (e) {
    setStep('pair', 'failed');
    status.textContent = `Pairing failed: ${e.message} — you can still pay by address below, or try demo mode.`;
    if (pairing) { pairing.cleanup(); pairing = null; }
    btn.disabled = false;
  }
}

function updateTipButton() {
  const btn = $('tip-btn');
  if (mode === 'demo') { btn.disabled = false; return; }
  btn.disabled = !(pairing && connectedAddress && current?.address);
}

// ---- events ------------------------------------------------------------------
function initEvents() {
  $('tab-tip').addEventListener('click', () => switchTab('tip'));
  $('tab-create').addEventListener('click', () => switchTab('create'));
  $('demo-note-off').addEventListener('click', () => switchTab('create'));

  document.querySelectorAll('.preset').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.preset').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    if (b.dataset.inr === 'custom') {
      $('custom-wrap').hidden = false;
      $('custom-inr').focus();
      const v = validateCustomAmount($('custom-inr').value);
      if (v.ok) { selectedInr = v.value; updateAmountLine(); }
    } else {
      $('custom-wrap').hidden = true;
      $('custom-error').hidden = true;
      selectedInr = Number(b.dataset.inr);
      updateAmountLine();
    }
  }));
  $('custom-inr').addEventListener('input', (e) => {
    const v = validateCustomAmount(e.target.value);
    const errEl = $('custom-error');
    if (!v.ok) { errEl.textContent = v.error; errEl.hidden = false; return; }
    errEl.hidden = true;
    selectedInr = v.value;
    updateAmountLine();
  });

  $('mode-live').addEventListener('click', () => setMode('live'));
  $('mode-demo').addEventListener('click', () => setMode('demo'));
  $('connect-btn').addEventListener('click', connectWallet);
  $('pair-cancel').addEventListener('click', () => {
    if (pairing) { pairing.cleanup(); pairing = null; }
    connectedAddress = null;
    $('pair-panel').hidden = true;
    $('connect-btn').disabled = false;
    $('connect-btn').textContent = 'Connect wallet (WizardConnect)';
    updateTipButton();
  });
  $('tip-btn').addEventListener('click', () => { if (mode === 'demo') tipDemo(); else tipLive(); });

  $('verify-btn').addEventListener('click', async () => {
    const out = $('verify-result');
    const txid = $('txid-input').value.trim();
    out.hidden = false;
    if (!txid) { out.textContent = 'Paste a transaction ID first.'; return; }
    if (!current.address) { out.textContent = 'This demo stall has no on-chain address yet — tip in demo mode first.'; return; }
    out.textContent = 'Checking on-chain…';
    try {
      const sats = inrToSats(selectedInr, rate.inrPerBch);
      const r = await verifyTipByTxid({ address: current.address, txid, sats, network: mode === 'demo' ? 'testnet' : 'mainnet' });
      out.textContent = r.found ? `✓ ${r.detail}` : r.detail;
      if (r.found) recordTip({ amountInr: selectedInr, sats, txid, feeSats: null, status: r.confirmed ? 'confirmed' : 'pending', ts: new Date().toISOString(), network: mode === 'demo' ? 'testnet' : 'mainnet' });
    } catch (e) {
      out.textContent = `Could not check right now: ${e.message}`;
    }
  });

  $('create-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      name: $('stall-name-input').value,
      tagline: $('stall-tagline-input').value,
      location: $('stall-location-input').value,
      address: $('stall-address-input').value.trim(),
    };
    const errors = validateStall(data, isValidAddress);
    const errEl = $('create-errors');
    if (errors.length) { errEl.innerHTML = errors.join('<br>'); errEl.hidden = false; return; }
    errEl.hidden = true;
    const stall = { id: 'stall-' + Date.now().toString(36), ...data, demo: false, createdAt: new Date().toISOString() };
    stalls.push(stall);
    saveStalls();
    $('created-link').textContent = stallLink(location.origin + location.pathname, stall.id);
    $('created-panel').hidden = false;
    QRCode.toCanvas($('created-qr'), stallLink(location.origin + location.pathname, stall.id), { width: 180, margin: 1 }).catch(() => {});
    $('copy-link-btn').onclick = () => navigator.clipboard?.writeText(stallLink(location.origin + location.pathname, stall.id)).then(() => { $('copy-link-btn').textContent = 'Copied!'; });
    $('view-stall-btn').onclick = () => { showStall(stall); switchTab('tip'); window.scrollTo({ top: 0 }); };
  });

  const list = $('demo-stall-list');
  DEMO_STALLS.forEach((s) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.innerHTML = `${s.name}<small>${s.location} · ${s.tagline} — demo, testnet only</small>`;
    b.addEventListener('click', () => { setMode('demo'); showStall(s); window.scrollTo({ top: 0 }); });
    li.appendChild(b);
    list.appendChild(li);
  });
}

function switchTab(which) {
  const tip = which === 'tip';
  $('view-tip').hidden = !tip;
  $('view-create').hidden = tip;
  $('tab-tip').classList.toggle('active', tip);
  $('tab-create').classList.toggle('active', !tip);
  $('tab-tip').setAttribute('aria-pressed', String(tip));
  $('tab-create').setAttribute('aria-pressed', String(!tip));
}

function setMode(m) {
  mode = m;
  $('mode-live').classList.toggle('active', m === 'live');
  $('mode-demo').classList.toggle('active', m === 'demo');
  $('mode-live').setAttribute('aria-pressed', String(m === 'live'));
  $('mode-demo').setAttribute('aria-pressed', String(m === 'demo'));
  $('connect-btn').style.display = m === 'demo' ? 'none' : '';
  $('pair-panel').hidden = true;
  updateAmountLine();
  updateTipButton();
}

// ---- boot --------------------------------------------------------------------
function boot() {
  initEvents();
  const params = new URLSearchParams(location.search);
  const wanted = params.get('stall');
  const found = wanted && [...stalls, ...DEMO_STALLS].find((s) => s.id === wanted);
  showStall(found || DEMO_STALLS[0]);
  refreshRate();
  initGlass();
}

// Boot immediately if the document is already parsed. The bundle's module
// graph contains top-level await in a dependency, so this module can finish
// evaluating AFTER DOMContentLoaded has already fired — listening for the
// event alone would silently never boot (found live, 2026-11-12).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
