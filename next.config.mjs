/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { webpack }) => {
    /* SDK auth menyeret jalur yang tidak kita pakai, dan paket-paketnya
       optional peer dependency yang tidak ikut terinstal `npm i`. Webpack
       tidak peduli kodenya tidak pernah dijalankan — ia tetap harus
       me-resolve importnya, dan build gagal:

       - `@x402/*`     ← connector Base Account (Coinbase), lewat
                          `@privy-io/wagmi` → `wagmi/connectors`
       - `@farcaster/*`← login Farcaster & Solana, lewat
                          `@privy-io/react-auth`

       Kita hanya memakai embedded wallet Privy di Monad (EVM). Login
       method yang dinyalakan cuma Google + email, dan `wagmiConfig` cuma
       punya satu chain. Tidak satu pun jalur di atas tersentuh.

       Satu aturan regex, bukan daftar nama: menambal satu per satu berarti
       build gagal berulang kali, karena paket berikutnya baru menampakkan
       diri setelah yang sebelumnya beres.

       Ini menutup kebutuhan build, bukan menyembunyikan bug — kalau suatu
       hari kita benar-benar memakai Base Account atau login Farcaster,
       importnya akan gagal dengan jelas, bukan diam-diam salah. */
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^(@x402|@farcaster)\// }),
    );

    /* Peringatan "Critical dependency" dari WalletConnect/pino. Bising,
       bukan galat — dan menutupinya di sini membuat galat sungguhan
       terlihat. */
    config.externals.push("pino-pretty", "lokijs", "encoding");

    return config;
  },
};

export default nextConfig;
