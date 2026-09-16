-- 민정머니 v0.1 동기화 테이블
-- 앱은 payload를 AES-GCM으로 암호화한 뒤 저장합니다.
create table if not exists public.money_sync (
  sync_key_hash text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.money_sync enable row level security;
revoke all on table public.money_sync from anon, authenticated;

create or replace function public.money_sync_pull(p_sync_key_hash text)
returns table(payload jsonb, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.payload, s.updated_at
  from public.money_sync s
  where s.sync_key_hash = p_sync_key_hash;
$$;

create or replace function public.money_sync_push(p_sync_key_hash text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.money_sync(sync_key_hash,payload,updated_at)
  values(p_sync_key_hash,p_payload,now())
  on conflict(sync_key_hash) do update
  set payload=excluded.payload, updated_at=now();
end;
$$;

revoke all on function public.money_sync_pull(text) from public;
revoke all on function public.money_sync_push(text,jsonb) from public;
grant execute on function public.money_sync_pull(text) to anon, authenticated;
grant execute on function public.money_sync_push(text,jsonb) to anon, authenticated;