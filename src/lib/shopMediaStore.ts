// Persistent shop image store backed by Supabase Storage ('shop-images' bucket)
// with row metadata in the 'shop_media' table.
//
// Expected Supabase setup (run once in the Supabase SQL editor):
//
//   -- 1) Public bucket for uploaded shop photos
//   insert into storage.buckets (id, name, public) values ('shop-images','shop-images', true)
//     on conflict (id) do nothing;
//
//   -- 2) Metadata table linking uploaded images to a barber (backend barber_id uuid)
//   create table if not exists public.shop_media (
//     id uuid primary key default gen_random_uuid(),
//     barber_id text not null,
//     url text not null,
//     position int not null default 0,
//     created_at timestamptz not null default now()
//   );
//   grant select on public.shop_media to anon, authenticated;
//   grant insert, update, delete on public.shop_media to authenticated;
//   alter table public.shop_media enable row level security;
//   create policy "shop_media read" on public.shop_media for select using (true);
//   create policy "shop_media write" on public.shop_media for all
//     to authenticated using (true) with check (true);
//
//   -- 3) Allow authenticated uploads to the bucket
//   create policy "shop-images upload" on storage.objects for insert
//     to authenticated with check (bucket_id = 'shop-images');
//   create policy "shop-images read" on storage.objects for select
//     using (bucket_id = 'shop-images');
//   create policy "shop-images delete" on storage.objects for delete
//     to authenticated using (bucket_id = 'shop-images');

import { supabase } from '@/lib/supabase';

export interface ShopMediaRow {
  id: string;
  barber_id: string;
  url: string;
  position: number;
  created_at: string;
}

const BUCKET = 'shop-images';
const TABLE = 'shop_media';

export async function listShopMedia(barberId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('url, position')
    .eq('barber_id', barberId)
    .order('position', { ascending: true });
  if (error || !data) return [];
  return (data as { url: string }[]).map((r) => r.url);
}

export async function listAllShopMedia(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('barber_id, url, position')
    .order('position', { ascending: true });
  if (error || !data) return {};
  const map: Record<string, string[]> = {};
  for (const row of data as { barber_id: string; url: string }[]) {
    (map[row.barber_id] ||= []).push(row.url);
  }
  return map;
}

export async function uploadShopImage(
  barberId: string,
  file: File,
  position: number,
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${barberId}/${Date.now()}-${position}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (upErr) throw new Error(upErr.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;
  const { error: insErr } = await supabase
    .from(TABLE)
    .insert({ barber_id: barberId, url: publicUrl, position });
  if (insErr) throw new Error(insErr.message);
  return publicUrl;
}

export async function deleteShopImage(barberId: string, url: string): Promise<void> {
  // Extract storage path from public URL
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const path = url.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  }
  await supabase.from(TABLE).delete().eq('barber_id', barberId).eq('url', url);
}
