// ChaiTip — pure BCH logic (no DOM, no network). Testable in Node.
// Amounts in INR (what humans think in) and satoshis (what BCH thinks in).

export const PRESET_TIPS_INR = [5, 10, 20];
export const MIN_TIP_INR = 1;
export const MAX_TIP_INR = 10000;
export const SATS_PER_BCH = 100_000_000;

// Fallback rate, used ONLY when the live CoinGecko fetch fails.
// Labelled in the UI with its date; never presented as live.
export const FALLBACK_RATE_INR_PER_BCH = 25742;
export const FALLBACK_RATE_AS_OF = '2026-11-05';

/** ₹ -> satoshis at a given rate (BCH per INR). Rounds to whole sats. */
export function inrToSats(inr, rateInrPerBch) {
  if (!Number.isFinite(inr) || inr <= 0) throw new Error('Amount must be positive');
  if (!Number.isFinite(rateInrPerBch) || rateInrPerBch <= 0) throw new Error('Invalid rate');
  return Math.round((inr / rateInrPerBch) * SATS_PER_BCH);
}

/** satoshis -> BCH as a trimmed decimal string (max 8 dp). */
export function satsToBch(sats) {
  return (sats / SATS_PER_BCH).toFixed(8).replace(/0+$/, '').replace(/\.$/, '.0');
}

/** satoshis -> ₹ at a given rate, 2dp. */
export function satsToInr(sats, rateInrPerBch) {
  return (sats / SATS_PER_BCH) * rateInrPerBch;
}

export function formatInr(inr) {
  return '₹' + Number(inr).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/** Validate a custom ₹ amount. Returns { ok, error? }. */
export function validateCustomAmount(inr) {
  if (inr === '' || inr === null || inr === undefined) return { ok: false, error: 'Enter an amount.' };
  const n = Number(inr);
  if (!Number.isFinite(n)) return { ok: false, error: 'That is not a number.' };
  if (n < MIN_TIP_INR) return { ok: false, error: `Minimum tip is ${formatInr(MIN_TIP_INR)}.` };
  if (n > MAX_TIP_INR) return { ok: false, error: `Maximum tip is ${formatInr(MAX_TIP_INR)}.` };
  return { ok: true, value: n };
}

/** Validate a vendor stall. Address validation is injected so tests can
 *  run with the real mainnet-js validator or a stub. */
export function validateStall({ name, address }, isValidAddress) {
  const errors = [];
  if (!name || !name.trim()) errors.push('Give the stall a name.');
  if (name && name.trim().length > 60) errors.push('Stall name must be 60 characters or fewer.');
  if (!address || !address.trim()) errors.push('Enter your BCH address (cashaddr).');
  else if (typeof isValidAddress === 'function' && !isValidAddress(address.trim())) {
    errors.push('That does not look like a valid BCH address. Check it in your wallet and try again.');
  }
  return errors;
}

/** Shorten a txid for display: first 8 … last 6. */
export function shortTxid(txid) {
  if (!txid || txid.length < 16) return txid || '';
  return txid.slice(0, 8) + '…' + txid.slice(-6);
}

/** Public explorer link for a BCH mainnet txid. */
export function explorerUrl(txid) {
  return `https://blockchair.com/bitcoin-cash/transaction/${txid}`;
}

/** Testnet explorer link. */
export function testnetExplorerUrl(txid) {
  return `https://explorer.bitcoin.com/tbch/tx/${txid}`;
}

/** Build the receipt object shown on the ticket stub. Pure formatting only. */
export function buildReceipt({ txid, sats, feeSats, rateInrPerBch, vendorName, timestamp, network }) {
  return {
    txid,
    shortTxid: shortTxid(txid),
    explorerUrl: network === 'testnet' ? testnetExplorerUrl(txid) : explorerUrl(txid),
    amountBch: satsToBch(sats),
    amountInr: formatInr(satsToInr(sats, rateInrPerBch)),
    feeBch: feeSats != null ? satsToBch(feeSats) : null,
    feeInr: feeSats != null ? formatInr(satsToInr(feeSats, rateInrPerBch)) : null,
    vendorName,
    timestamp: timestamp || new Date().toISOString(),
    network: network || 'mainnet',
  };
}

/** A stall page share link for this deployment origin. */
export function stallLink(origin, stallId) {
  return `${origin}${origin.endsWith('/') ? '' : '/'}?stall=${encodeURIComponent(stallId)}`;
}
