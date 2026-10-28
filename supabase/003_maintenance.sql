-- Public service status, administered only by an existing server-verified admin.
begin;
create table if not exists public.saku_app_settings (
  singleton boolean primary key default true check(singleton),
  maintenance boolean not null default false,
  message text not null default 'Kami sedang memperbarui SakuPintar agar lebih nyaman digunakan. Coba lagi sebentar, ya.' check(length(btrim(message)) between 1 and 240),
  updated_at timestamptz not null default now()
);
alter table public.saku_app_settings enable row level security;
revoke all on public.saku_app_settings from public,anon,authenticated;
insert into public.saku_app_settings(singleton) values(true) on conflict do nothing;

create or replace function public.app_runtime_status() returns jsonb
language sql stable security definer set search_path=''
as $$ select jsonb_build_object('maintenance',maintenance,'message',message,'updated_at',updated_at) from public.saku_app_settings where singleton=true $$;
revoke all on function public.app_runtime_status() from public;
grant execute on function public.app_runtime_status() to anon,authenticated;

create or replace function public.set_app_maintenance(p_enabled boolean,p_message text) returns jsonb
language plpgsql security definer set search_path=''
as $$ begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Akses admin diperlukan.'; end if;
  if p_enabled is null or p_message is null or length(btrim(p_message)) not between 1 and 240 then raise exception 'Isi pesan maintenance 1 sampai 240 karakter.'; end if;
  update public.saku_app_settings set maintenance=p_enabled,message=btrim(p_message),updated_at=clock_timestamp() where singleton=true;
  return public.app_runtime_status();
end $$;
revoke all on function public.set_app_maintenance(boolean,text) from public,anon;
grant execute on function public.set_app_maintenance(boolean,text) to authenticated;

-- Block wallet writes from signed-in non-admin users, including older clients.
-- Dashboard migrations and trusted service jobs without a user JWT keep working.
create or replace function public.saku_check_wallet_maintenance() returns trigger
language plpgsql security definer set search_path=''
as $$ begin
  if auth.uid() is not null
     and exists(select 1 from public.saku_app_settings where singleton=true and maintenance=true)
     and not public.is_admin() then
    raise exception 'Maintenance sedang berlangsung. Coba lagi setelah pembaruan selesai.';
  end if;
  return new;
end $$;
revoke all on function public.saku_check_wallet_maintenance() from public,anon,authenticated;
do $$ begin
  if not exists(select 1 from pg_trigger where tgname='saku_maintenance_wallet' and tgrelid='public.wallet_accounts'::regclass) then
    create trigger saku_maintenance_wallet before update on public.wallet_accounts for each row execute function public.saku_check_wallet_maintenance();
  end if;
  if not exists(select 1 from pg_trigger where tgname='saku_maintenance_goals' and tgrelid='public.savings_goals'::regclass) then
    create trigger saku_maintenance_goals before insert or update on public.savings_goals for each row execute function public.saku_check_wallet_maintenance();
  end if;
  if not exists(select 1 from pg_trigger where tgname='saku_maintenance_transactions' and tgrelid='public.wallet_transactions'::regclass) then
    create trigger saku_maintenance_transactions before insert on public.wallet_transactions for each row execute function public.saku_check_wallet_maintenance();
  end if;
end $$;
commit;
