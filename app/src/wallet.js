// ChaiTip — wallet layer.
// Live path: WizardConnect (@wizardconnect/core) dapp relay -> Paytaca/Selene.
// Demo path: throwaway mainnet-js TestNetWallet (testnet, no real money).
// Fallback path: pay by address, verify by txid against on-chain history.
// Nothing here ever asks for or stores a seed phrase, WIF, or private key.

import {
  Wallet, TestNetWallet, WatchWallet, TestNetWatchWallet,
  getAddrsByXpubKey, isValidAddress, toCashaddr, libauth,
} from 'mainnet-js';
import { initiateDappRelay, RelayMsgAction } from '@wizardconnect/core';

export { isValidAddress, toCashaddr };

// ---- constants -----------------------------------------------------------
export const SIGN_TIMEOUT_MS = 120_000;
const DUST_SATS = 546;
const FEE_RATE_SATS_PER_BYTE = 2;

/** P2PKH placeholder unlocking bytecode: <71 zero bytes as sig><33 zero bytes as pubkey>.
 *  The wallet replaces these placeholders when it signs (BCH WalletConnect tx format). */
export function placeholderUnlockingBytecode() {
  const b = new Uint8Array(1 + 71 + 1 + 33);
  b[0] = 0x47; // push 71 bytes
  b[72] = 0x21; // push 33 bytes
  return b;
}

// ---- WizardConnect pairing ----------------------------------------------
/**
 * Start a WizardConnect dapp relay session.
 * Returns { qrUri, uri, cleanup, waitForSession }.
 * waitForSession resolves with { paths: [{name, xpub}] } when the wallet
 * sends wallet_ready, or rejects on timeout / disconnect.
 * LIVE-WALLET STATUS: implemented against the real @wizardconnect/core SDK;
 * the handshake against a real Paytaca/Selene wallet is UNVERIFIED until
 * the user's phone test (see BUILD_PLAN.md step 6).
 */
export function startPairing(onStatus = () => {}) {
  const relay = initiateDappRelay((status) => onStatus(status));
  const { client, qrUri, uri, cleanup, events } = relay;

  let sessionResolve, sessionReject;
  const sessionPromise = new Promise((resolve, reject) => {
    sessionResolve = resolve; sessionReject = reject;
  });

  events.on('keyexchangecomplete', (walletPublicKey) => {
    onStatus({ stage: 'keyexchange', detail: 'Wallet scanned the QR — waiting for session…' });
    try { client.setPairedPublicKey(walletPublicKey); } catch { /* non-fatal */ }
  });

  client.on('message', (msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.action === RelayMsgAction.WalletReady || msg.action === 'wallet_ready') {
      const session = msg.session || msg.data?.session || null;
      if (session && Array.isArray(session.paths)) sessionResolve(session);
      else sessionReject(new Error('Wallet connected but sent no HD session (no xpubs).'));
    }
    if (msg.action === 'sign_transaction_response' || msg.action === RelayMsgAction.SignTransactionResponse) {
      pendingSign.resolve(msg);
    }
    if (msg.error) pendingSign.reject(new Error(String(msg.error)));
  });

  const pendingSign = deferred();

  const timeout = setTimeout(() => {
    sessionReject(new Error('Pairing timed out after 2 minutes. The wallet never completed the handshake.'));
  }, SIGN_TIMEOUT_MS);
  sessionPromise.then(() => clearTimeout(timeout), () => clearTimeout(timeout));

  return {
    qrUri,
    uri,
    cleanup: () => { clearTimeout(timeout); try { cleanup(); } catch { /* ignore */ } },
    waitForSession: () => sessionPromise,
    client,
    nextSequence: () => client.nextSequence(),
    /** Send a sign request and await the wallet's response. */
    requestSignature: (wcRequest, inputPaths) => requestSignature(client, pendingSign, wcRequest, inputPaths),
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function requestSignature(client, pendingSign, wcRequest, inputPaths) {
  const sequence = client.nextSequence();
  const request = {
    action: RelayMsgAction.SignTransactionRequest,
    transaction: wcRequest.transaction,
    sourceOutputs: wcRequest.sourceOutputs,
    inputPaths,
    sequence,
    time: Date.now(),
  };
  const responsePromise = pendingSign.promise;
  await client.relay(request);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Wallet did not sign within 2 minutes.')), SIGN_TIMEOUT_MS));
  const msg = await Promise.race([responsePromise, timeout]);
  if (msg.error) throw new Error(`Wallet refused to sign: ${msg.error}`);
  if (!msg.signedTransaction) throw new Error('Wallet replied without a signed transaction.');
  return { signedTransaction: msg.signedTransaction, txid: msg.signedTransactionHash || null };
}

// ---- address derivation ---------------------------------------------------
/** Derive the first receive address from a WizardConnect HD session xpub. */
export function deriveReceiveAddress(xpub, network = 'mainnet') {
  const addrs = getAddrsByXpubKey(xpub, network, 1);
  const first = Array.isArray(addrs) ? addrs[0] : addrs;
  if (!first) throw new Error('Could not derive an address from the wallet session.');
  return typeof first === 'string' ? first : first.cashaddr || first.address;
}

// ---- UTXO + unsigned transaction building ---------------------------------
export async function fetchUtxos(address, network = 'mainnet') {
  const Watch = network === 'testnet' ? TestNetWatchWallet : WatchWallet;
  const w = new Watch(address);
  const utxos = await w.getUtxos();
  return (utxos || []).filter((u) => !u.token).map((u) => ({
    txid: u.txid, vout: u.vout, satoshis: BigInt(u.satoshis), address: u.address,
  }));
}

function estimateFee(numInputs, numOutputs) {
  const bytes = 10 + numInputs * 148 + numOutputs * 34;
  return Math.max(500, bytes * FEE_RATE_SATS_PER_BYTE);
}

/**
 * Build an UNSIGNED BCH transaction (BCH WalletConnect format) that sends
 * `sats` to `toCashaddr` from `fromAddress`, spending `utxos`.
 * Returns { wcRequest, feeSats, changeSats, inputPaths, spentSats }.
 * inputPaths uses the WizardConnect 'receive' path for every input.
 * Pure construction — verified in tests by decode round-trip. The wallet
 * signs it; this code never signs mainnet funds itself.
 */
export function buildWcTransaction({ utxos, fromAddress, toCashaddr: to, sats }) {
  const target = BigInt(sats);
  if (target <= 0n) throw new Error('Tip amount must be positive.');
  const sorted = [...utxos].sort((a, b) => (b.satoshis > a.satoshis ? 1 : -1));
  const chosen = [];
  let total = 0n;
  for (const u of sorted) {
    chosen.push(u); total += u.satoshis;
    const fee = BigInt(estimateFee(chosen.length, 2));
    if (total >= target + fee) break;
  }
  const feeWithChange = BigInt(estimateFee(chosen.length, 2));
  if (total < target + feeWithChange) {
    throw new Error(`Wallet balance (${total} sats) is short for this tip + fee.`);
  }
  const change = total - target - feeWithChange;
  const hasChange = change >= BigInt(DUST_SATS);
  const fee = hasChange ? feeWithChange : total - target;

  const fromLocking = libauth.cashAddressToLockingBytecode(fromAddress);
  const toLocking = libauth.cashAddressToLockingBytecode(to);
  if (typeof fromLocking === 'string' || typeof toLocking === 'string') {
    throw new Error('Could not encode one of the addresses. Check the stall address.');
  }

  const inputs = chosen.map((u) => ({
    outpointTransactionHash: libauth.hexToBin(u.txid),
    outpointIndex: u.vout,
    unlockingBytecode: placeholderUnlockingBytecode(),
    sequenceNumber: 0xffffffff,
  }));
  const outputs = [{ lockingBytecode: toLocking, valueSatoshis: target }];
  if (hasChange) outputs.push({ lockingBytecode: fromLocking, valueSatoshis: change });

  const transaction = { version: 2, inputs, outputs, locktime: 0 };
  // Verify the assembled transaction decodes cleanly before handing it over.
  const encoded = libauth.encodeTransaction(transaction);
  const decoded = libauth.decodeTransaction(encoded);
  if (typeof decoded === 'string' || decoded.outputs.length !== outputs.length) {
    throw new Error('Internal error: built transaction failed its own decode check.');
  }

  const sourceOutputs = chosen.map((u) => ({
    outpointTransactionHash: libauth.hexToBin(u.txid),
    outpointIndex: u.vout,
    unlockingBytecode: placeholderUnlockingBytecode(),
    sequenceNumber: 0xffffffff,
    lockingBytecode: fromLocking,
    valueSatoshis: u.satoshis,
  }));

  return {
    wcRequest: {
      transaction,
      sourceOutputs,
      broadcast: true,
      userPrompt: `Tip ${to} — ChaiTip`,
    },
    feeSats: Number(fee),
    changeSats: hasChange ? Number(change) : 0,
    inputPaths: chosen.map((_, i) => [i, 'receive', 0]),
    spentSats: Number(total),
  };
}

// ---- demo (testnet) wallet -------------------------------------------------
/** Create a throwaway testnet wallet in the browser. DEMO ONLY — labelled everywhere. */
export async function createDemoWallet() {
  const w = await TestNetWallet.newRandom();
  const address = w.getDepositAddress ? w.getDepositAddress() : w.address;
  return { wallet: w, address: String(address) };
}

/** Send a real testnet tip from a demo wallet. Throws honestly if unfunded. */
export async function sendDemoTip(demoWallet, toCashaddr, sats) {
  const balance = await demoWallet.getBalance();
  if (balance < BigInt(sats) + 1000n) {
    throw new Error(
      `Demo wallet is empty (${balance} sats). Fund it from a BCH testnet faucet first — the faucet link is on the demo panel.`
    );
  }
  const result = await demoWallet.send([{ cashaddr: toCashaddr, value: sats, unit: 'sat' }]);
  return { txid: result.txid || result.txId || null, raw: result };
}

// ---- verify by txid --------------------------------------------------------
/** Check a pasted txid against a stall address's on-chain history.
 *  Returns { found, confirmed, detail }. Best-effort: history shapes vary,
 *  so a missing entry is reported as "not found (yet)", never as fraud. */
export async function verifyTipByTxid({ address, txid, sats, network = 'mainnet' }) {
  const Watch = network === 'testnet' ? TestNetWatchWallet : WatchWallet;
  const w = new Watch(address);
  const history = await w.getHistory();
  const list = Array.isArray(history) ? history : history?.history || [];
  const match = list.find((h) => {
    const id = h.tx_hash || h.txid || h.txId || h.hash || '';
    return String(id).toLowerCase() === txid.toLowerCase();
  });
  if (!match) return { found: false, confirmed: false, detail: 'No transaction with that ID in this stall’s history yet. It may still be propagating — try again in a minute.' };
  return {
    found: true,
    confirmed: (match.height || 0) > 0,
    detail: `Found on-chain${(match.height || 0) > 0 ? ` at block ${match.height}` : ' (unconfirmed)'}.`,
    match,
  };
}

// Keep the Wallet import referenced (used by bundlers/type checks).
export const _Wallet = Wallet;
