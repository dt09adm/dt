-- ============================================
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- (Project → SQL Editor → New query → dán vào → Run)
-- ============================================

-- Bảng lưu thông tin file
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  size bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.files enable row level security;

-- Người dùng chỉ thấy/thao tác được file của chính mình
create policy "Users can view own files"
  on public.files for select
  using (auth.uid() = user_id);

create policy "Users can insert own files"
  on public.files for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own files"
  on public.files for delete
  using (auth.uid() = user_id);

-- ============================================
-- Storage bucket (chạy sau khi đã tạo bucket "files" ở bước UI, xem README)
-- ============================================

create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own folder"
  on storage.objects for select
  using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
