/* Identitas cursor — nama + warna, keduanya diturunkan dari client id.
   Tidak ada koordinasi server: dua browser yang melihat id yang sama selalu
   menggambar nama dan warna yang sama. Karena itu payload broadcast cukup
   {i, x, y} — nama dan warna tidak perlu ikut dikirim sama sekali.

   Nama disampling dari `funny_kaggle_usernames.csv` (14.408 baris, 2,8 MB)
   saat build, bukan runtime — CSV-nya tidak pernah sampai ke klien.
   Skrip sampling: kategori pun/geek joke/wordplay/meme origin, ASCII, 4–14
   karakter (di Press Start 2P 9px, 14 karakter ≈ 126px — label lebih panjang
   dari itu mulai menabrak cursor sebelahnya), blocklist untuk apa pun yang
   tidak boleh muncul di layar proyektor, lalu diambil merata sepanjang
   alfabet supaya subsetnya tidak semuanya berawalan A. */

export const CURSOR_NAMES = [
  "A 4d tesseract", "Ach_Orite", "AIdanR8", "ali seeed",
  "AMINO Tyrosine", "Anna List", "aquawheel", "Ash_man",
  "autodidact", "BadaAayaNoob", "Barneylover88", "BearCYW",
  "Betelegeuse", "bilal2vec", "BLACK AURORA", "BlueLoki",
  "BooHuu", "branprice", "Buckaroo", "BytesInARow",
  "canonisensys14", "cat milk", "chamo", "ChicagoAlphago",
  "ChrisUniverse", "clumsyhu", "Coding Womble", "compscihamnida",
  "CoRRision", "CreamSoda", "Cuban Pete", "Cyborgzarvis",
  "DaniTheFireman", "Data Spider", "dataMainiac", "David Funni",
  "deepshark", "Develed", "Divide by Zero", "Domnik_Gaming",
  "Dr Doombledore", "Drop0utShark", "Dullaz", "EdBoy",
  "elMartino", "Ernies Tools", "FailTrain", "Featherwit",
  "FishCounter", "flying_madman", "Foxet", "frogsace",
  "futurewarning", "Geek Kong", "GhostsDragons", "Gojilla",
  "GraC2H5", "GruffaloNL", "hamberber", "HeyImSK",
  "holy_g", "Human Analog", "IAmParadox", "ilh1em",
  "InfiniteWing", "Iron Wolf", "jackandjill", "Jax Kluesner",
  "Jhon Codeur", "Joshua_void", "JustClassa", "KagglingSushi",
  "Keuh20", "Kju Turtle", "Kraggle", "Lanchor Matey",
  "lazzy_dev", "lemonramen3", "Limerobot", "LLyamzinLLove",
  "lordofsauce", "Luffy D", "macrohumanity", "magicpants",
  "Manoemonroe", "MasterLearning", "maxmeomeo", "MegaTobyMa",
  "MetaPeter", "mining_machine", "mlisfun4real", "Monster Big",
  "mountkailash", "MrOhDubs", "My_Name", "nanoriddler",
  "NerdGoose", "nicapotato", "no_to_plastic", "noodlenoob",
  "NothingToCrab", "nyamnyam", "OkkBand", "OnionMonster",
  "outshined", "pandakaggles", "pavlovator", "Pi_irrational",
  "Pirata pop_pop", "pogomaniac", "powerwook", "PROGRAMMERYTT",
  "Pupu Lazy", "pythoninsta", "quickfixremix", "rajah_smallz",
  "razorhand", "replcoin", "rmse_inf", "RogueDisaster",
  "Ruthority", "SamuraiMate", "Scrambledegg", "SetAI",
  "Sherconan", "sketchiGGle", "slothdonut", "Snark AI",
  "SoloStudent", "Spaceator", "spyderwebr", "starlord88",
  "stochastic", "Submarineering", "SuperBearBeats", "Sw33tDisasteR",
  "TakahiLunch", "Telemachus", "Th3Suarez", "TheAstronaut",
  "thePangolin", "THURisotto", "Tom Tuning", "Transformology",
  "trunkrat", "UCAS_Bernoulli", "UpSideGravity", "vggls",
  "Wabbajack", "Wave4k", "WHershey", "Windmen",
  "woodkeeper", "xyzane", "YouKnowJP", "Zephyr Gold",
];

/* FNV-1a 32-bit. Dipakai dengan dua seed berbeda supaya nama dan warna tidak
   berkorelasi — kalau satu hash saja yang dipakai untuk keduanya, nama yang
   berdekatan di array selalu kebagian hue yang berdekatan juga. */
function fnv1a(input: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export type CursorIdentity = { name: string; color: string };

export function identityFor(id: string): CursorIdentity {
  const name = CURSOR_NAMES[fnv1a(id, 0x811c9dc5) % CURSOR_NAMES.length];

  /* Saturasi & lightness dikunci: hue bebas, tapi tiap cursor harus tetap
     terbaca di atas hitam murni DAN cukup gelap untuk label teks hitam
     di atasnya. Hue acak dengan lightness acak menghasilkan label yang
     kadang tidak terbaca sama sekali. */
  const hue = fnv1a(id, 0x9e3779b1) % 360;
  return { name, color: `hsl(${hue} 90% 66%)` };
}

/* Satu id per tab, bertahan melewati refresh (sessionStorage, bukan
   localStorage: dua tab di browser yang sama harus jadi dua orang). */
const STORAGE_KEY = "cleartune:cursor-id";

export function clientId(): string {
  try {
    const found = sessionStorage.getItem(STORAGE_KEY);
    if (found) return found;
    const made =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(STORAGE_KEY, made);
    return made;
  } catch {
    /* Safari private mode melempar di sessionStorage. Id sementara tetap
       lebih baik daripada cursor yang tidak muncul sama sekali. */
    return Math.random().toString(36).slice(2);
  }
}
