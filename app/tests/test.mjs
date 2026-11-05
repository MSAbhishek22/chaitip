// ChaiTip — automated tests (node:test). Run: npm test
// Covers pure logic (bch.js) + verifiable construction (wallet.js tx builder).
// Nothing here touches the live chain or a real wallet.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from 'mainnet-js';
import { generateKeyExchangeCredentials, encodeKeyExchangeURI } from '@wizardconnect/core';
import {
  inrToSats, satsToBch, satsToInr, formatInr, validateCustomAmount,
  validateStall, shortTxid, explorerUrl, buildReceipt,
  PRESET_TIPS_INR, FALLBACK_RATE_INR_PER_BCH,
} from '../src/bch.js';
import {
  placeholderUnlockingBytecode, buildWcTransaction, isValidAddress,
} from '../src/wallet.js';

const RATE = 25742; // ₹ per BCH, as verified on CoinGecko 2026-11-05

test('₹ -> sats conversion at the verified rate', () => {
  assert.equal(inrToSats(10, RATE), 38847);
  assert.equal(inrToSats(5, RATE), 19424);
  assert.equal(inrToSats(20, RATE), 77694);
  assert.throws(() => inrToSats(0, RATE), /positive/);
  assert.throws(() => inrToSats(10, 0), /rate/);
});

test('sats -> BCH and ₹ round-trips', () => {
  assert.equal(satsToBch(38846), '0.00038846');
  assert.equal(satsToBch(100_000_000), '1.0');
  assert.ok(Math.abs(satsToInr(38846, RATE) - 10) < 0.01);
  assert.equal(formatInr(25742), '₹25,742');
});

test('custom amount validation', () => {
  assert.deepEqual(validateCustomAmount(''), { ok: false, error: 'Enter an amount.' });
  assert.deepEqual(validateCustomAmount('0'), { ok: false, error: 'Minimum tip is ₹1.' });
  assert.deepEqual(validateCustomAmount('abc'), { ok: false, error: 'That is not a number.' });
  assert.deepEqual(validateCustomAmount('10001'), { ok: false, error: 'Maximum tip is ₹10,000.' });
  assert.deepEqual(validateCustomAmount('15'), { ok: true, value: 15 });
  assert.deepEqual(PRESET_TIPS_INR, [5, 10, 20]);
});

test('stall validation rejects bad addresses, accepts a real one', async () => {
  const w = await m.Wallet.newRandom();
  const addr = String(w.getDepositAddress());
  assert.equal(isValidAddress(addr), true);
  assert.deepEqual(validateStall({ name: 'Ramesh Chai', address: addr }, isValidAddress), []);
  assert.ok(validateStall({ name: '', address: addr }, isValidAddress).length > 0);
  assert.ok(validateStall({ name: 'X', address: 'not-an-address' }, isValidAddress).length > 0);
  assert.ok(validateStall({ name: 'X', address: '' }, isValidAddress).length > 0);
});

test('receipt formatting', () => {
  const txid = 'a'.repeat(64);
  const r = buildReceipt({ txid, sats: 38846, feeSats: 500, rateInrPerBch: RATE, vendorName: 'Ramesh Chai', timestamp: '2026-11-05T10:00:00.000Z', network: 'mainnet' });
  assert.equal(r.shortTxid, 'aaaaaaaa…aaaaaa');
  assert.equal(shortTxid(txid), 'aaaaaaaa…aaaaaa');
  assert.equal(r.amountBch, '0.00038846');
  assert.equal(r.amountInr, '₹10');
  assert.equal(r.explorerUrl, explorerUrl(txid));
  assert.ok(r.explorerUrl.startsWith('https://blockchair.com/bitcoin-cash/transaction/'));
});

test('placeholder unlocking bytecode shape (71-byte sig + 33-byte pubkey)', () => {
  const b = placeholderUnlockingBytecode();
  assert.equal(b.length, 106);
  assert.equal(b[0], 0x47);
  assert.equal(b[72], 0x21);
});

test('unsigned tip transaction builds and decodes cleanly', async () => {
  const from = await m.Wallet.newRandom();
  const to = await m.Wallet.newRandom();
  const fromAddr = String(from.getDepositAddress());
  const toAddr = String(to.getDepositAddress());
  const utxos = [
    { txid: 'b'.repeat(64), vout: 0, satoshis: 100000n, address: fromAddr },
    { txid: 'c'.repeat(64), vout: 1, satoshis: 50000n, address: fromAddr },
  ];
  const built = buildWcTransaction({ utxos, fromAddress: fromAddr, toCashaddr: toAddr, sats: 38846 });
  assert.equal(built.wcRequest.transaction.outputs.length, 2, 'payment + change');
  assert.equal(built.wcRequest.transaction.outputs[0].valueSatoshis, 38846n);
  assert.equal(built.feeSats > 0, true);
  assert.equal(built.inputPaths[0][1], 'receive');
  assert.equal(built.wcRequest.broadcast, true);
  // Decode round-trip: the encoded tx must parse back with the same outputs.
  const encoded = m.libauth.encodeTransaction(built.wcRequest.transaction);
  const decoded = m.libauth.decodeTransaction(encoded);
  assert.equal(decoded.outputs.length, 2);
  assert.equal(decoded.outputs[0].valueSatoshis, 38846n);
  assert.equal(decoded.inputs.length, 1, 'one UTXO covers ₹10 + fee');
});

test('unsigned tip transaction refuses an unfunded wallet', async () => {
  const from = await m.Wallet.newRandom();
  const to = await m.Wallet.newRandom();
  const fromAddr = String(from.getDepositAddress());
  const toAddr = String(to.getDepositAddress());
  assert.throws(
    () => buildWcTransaction({ utxos: [{ txid: 'd'.repeat(64), vout: 0, satoshis: 100n, address: fromAddr }], fromAddress: fromAddr, toCashaddr: toAddr, sats: 38846 }),
    /short for this tip/
  );
});

test('WizardConnect pairing credentials produce a real pairing URI', () => {
  const creds = generateKeyExchangeCredentials();
  assert.ok(creds.publicKey.length > 0);
  assert.ok(creds.secret.length > 0);
  const { uri, qrUri } = encodeKeyExchangeURI(creds.publicKey, creds.secret);
  assert.ok(uri.startsWith('wiz://?p='));
  assert.ok(qrUri.startsWith('WIZ://'));
});

test('cleanup: disconnect providers so the runner can exit', async () => {
  // mainnet-js holds provider connections open; without this the test
  // process never exits (event loop stays alive with no work).
  await m.disconnectProviders();
});
