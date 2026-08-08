import { supabase } from "./supabase";

// Mirrors the audio upload in register/page.tsx — direct client-side upload
// to Supabase Storage (anon client), public bucket. Requires a `covers`
// bucket to exist (see supabase/schema.sql for the bootstrap SQL), same as
// the pre-existing `audio` bucket this app already relies on.
export async function uploadCover(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("covers").upload(path, file);
  if (error) throw new Error(`upload cover gagal: ${error.message}`);
  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}
