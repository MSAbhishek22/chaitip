// Stub for @mem-cash/electrum — an optional dependency of mainnet-js used ONLY
// by its MockNetworkProvider, which ChaiTip never uses. The real Electrum
// provider is bundled with mainnet-js itself. These stubs throw if ever
// called, so a silent wrong-network call is impossible.
export function asTransport() {
  throw new Error('@mem-cash/electrum is stubbed out: the mock network provider is not used by ChaiTip.');
}
export function createIndexer() {
  throw new Error('@mem-cash/electrum is stubbed out: the mock network provider is not used by ChaiTip.');
}
