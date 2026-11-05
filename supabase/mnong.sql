-- Nội dung triển lãm M'Nông trên Supabase (dùng chung dự án với website-susu; mọi bảng có tiền tố mnong_).
-- Web không gọi Supabase trực tiếp: hàm Vercel (api/) đọc/ghi bằng service role key, nên không mở quyền gì cho khách.
-- Chạy lại nhiều lần không lỗi.

-- Dọn các bản thử trước (schema riêng, hàm đăng nhập, tài khoản trong bảng) nếu đã chạy.
drop schema if exists mnong cascade;
drop function if exists public.mnong_save(text, text, jsonb);
drop function if exists public.mnong_login(text, text);
drop function if exists public.mnong_setup(text, text);
drop function if exists public.mnong_has_admin();
drop function if exists public.mnong_check(text, text);
drop table if exists public.mnong_admin;

-- 8 dòng: "site" và tên file từng gian; data là nội dung file JSON tương ứng.
create table if not exists public.mnong_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Bản cũ trước mỗi lần sửa. Khôi phục: chép data của dòng muốn lấy về lại mnong_content.
create table if not exists public.mnong_content_history (
  id bigserial primary key,
  content_id text not null,
  data jsonb not null,
  saved_at timestamptz not null
);

-- Dự án dùng chung này khoá schema public với mọi vai trò API; mở lại riêng cho service role (chỉ máy chủ có key này).
grant usage on schema public to service_role;

-- RLS bật, không có policy: chỉ service role (máy chủ) đọc/ghi được.
alter table public.mnong_content enable row level security;
alter table public.mnong_content_history enable row level security;
drop policy if exists "mnong_content public read" on public.mnong_content;
revoke all on public.mnong_content, public.mnong_content_history from anon, authenticated;
grant select, insert, update on public.mnong_content to service_role;
grant select, insert on public.mnong_content_history to service_role;
grant usage, select on sequence public.mnong_content_history_id_seq to service_role;

create or replace function public.mnong_keep_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.mnong_content_history (content_id, data, saved_at) values (old.id, old.data, old.updated_at);
  return new;
end $$;
revoke all on function public.mnong_keep_history() from public, anon, authenticated;

drop trigger if exists mnong_content_history on public.mnong_content;
create trigger mnong_content_history before update on public.mnong_content
  for each row execute function public.mnong_keep_history();
