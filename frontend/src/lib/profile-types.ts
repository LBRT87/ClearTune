/* Bentuk profil — dipakai klien DAN server, jadi file ini tidak boleh
   mengimpor apa pun yang khusus server (tiket auth/04 & 05). */

export type Role = "artist" | "listener";

export type Profile = {
  privy_did: string;
  wallet: string | null;
  role: Role;
  display_name: string;
  funded_at: string | null;
  created_at: string;
};

/** Peran disimpan dalam bahasa Inggris mengikuti model data spec §4.3;
 *  `?role=` di URL memakai bahasa UI. Penerjemahan itu tugas lapisan
 *  tampilan, dan ini satu-satunya tempatnya. */
export function roleFromParam(param: string | null | undefined): Role | null {
  if (param === "musisi") return "artist";
  if (param === "pendengar") return "listener";
  return null;
}

/** Ke mana peran ini mendarat.
 *
 *  Menunjuk route yang SUDAH ADA di app ini (`(app)/dashboard` dan
 *  `(app)/home`), bukan shell placeholder. Prototipe auth menggambar shell
 *  sendiri karena saat itu dashboard-nya belum ada; sekarang sudah, dan
 *  menambahkan shell kedua cuma akan jadi dashboard palsu di sebelah yang
 *  asli.
 *
 *  Peran menentukan tujuan, bukan izin — musisi tetap boleh membuka
 *  `/home`. */
export function homeFor(role: Role): "/dashboard" | "/home" {
  return role === "artist" ? "/dashboard" : "/home";
}
