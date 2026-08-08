/* Parameter kontrak (project-spec.md §4.1). Semua akuntansi dalam satuan
   terkecil mUSD (6 desimal) — tidak pernah float, sesuai aturan validasi §6.

   Dipisah dari komponen supaya struk di babak penutup (server component) dan
   widget hero (client component) menghitung dari angka yang sama persis. */

export const RATE_PER_PLAY = 20000;
export const PLATFORM_FEE_BPS = 800;

export const PAYEES = [
  { name: "Rekah", bps: 5000 },
  { name: "Anindya", bps: 2500 },
  { name: "Bagas", bps: 1500 },
  { name: "Studio Tepi", bps: 1000 },
] as const;

export const TOTAL_BPS = PAYEES.reduce((s, p) => s + p.bps, 0);

/* Spec §6: total bps per lagu harus TEPAT 10000, dan itu ditegakkan di
   kontrak — bukan cuma ditulis di UI. Invariannya diulang di sini supaya
   split sheet yang dipajang tidak bisa diam-diam meleset dari yang akan
   diterima kontrak: kalau ada yang mengubah PAYEES dan lupa menyeimbangkan,
   halaman gagal di-build, bukan tampil dengan angka yang salah. */
if (TOTAL_BPS !== 10000) {
  throw new Error(`Split sheet total bps must be 10000, got ${TOTAL_BPS}`);
}

/** Pembagian satu play. Dust dilempar ke payee terakhir (spec §6). */
export function settle(rate: number) {
  const fee = Math.floor((rate * PLATFORM_FEE_BPS) / 10000);
  const net = rate - fee;

  const shares = PAYEES.map((p) => ({
    ...p,
    amount: Math.floor((net * p.bps) / 10000),
  }));

  const distributed = shares.slice(0, -1).reduce((s, p) => s + p.amount, 0);
  shares[shares.length - 1].amount = net - distributed;

  return { fee, net, shares };
}

export const SETTLEMENT = settle(RATE_PER_PLAY);

/** 1000 -> "0.001000" — 6 decimal places. */
export const fmt = (n: number) => (n / 1e6).toFixed(6);
