/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // wagmi/@wagmi/connectors unconditionally imports the Base Account
    // connector, which currently ships broken transitive x402 payment
    // deps. We don't use Base Account/Coinbase Smart Wallet in this app —
    // stub it out so webpack doesn't try to resolve it.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@base-org/account": false,
      // Known benign optional deps pulled in by MetaMask SDK (React Native
      // storage) and WalletConnect's logger (pretty-printing for Node) —
      // neither is used in the browser bundle.
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
      // Sama polanya, dari sisi Privy: `@privy-io/react-auth` mengimpor
      // jalur login Farcaster/Solana yang paket-paketnya optional peer dan
      // tidak ikut terinstal. Kita cuma pakai Google, email, dan wallet
      // EVM — jalur itu tidak pernah tersentuh, tapi webpack tetap harus
      // me-resolve importnya kalau tidak distub.
      "@farcaster/mini-app-solana": false,
    };
    return config;
  },
};

export default nextConfig;
