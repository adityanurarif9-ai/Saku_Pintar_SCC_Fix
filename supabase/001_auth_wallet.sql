-- Run once in the Supabase SQL Editor for a new SakuPintar project.
-- No passwords or service_role keys belong in this script or frontend code.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 60),
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
create table public.wallet_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance between 0 and 9000000000000)
);
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  target bigint not null check (target between 1 and 999999999999),
  saved bigint not null default 0 check (saved >= 0 and saved <= target),
  notes text not null default '' check (length(notes) <= 300),
  created_at timestamptz not null default now()
);
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('income', 'expense', 'transfer')),
  title text not null check (length(title) between 1 and 100),
  amount bigint not null check (amount between 1 and 999999999999),
  category text not null,
  transaction_date date not null,
  notes text not null default '' check (length(notes) <= 300),
  created_at timestamptz not null default now()
);
create index on public.savings_goals(user_id, created_at);
create index on public.wallet_transactions(user_id, transaction_date, created_at);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.savings_goals enable row level security;
alter table public.wallet_transactions enable row level security;
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy wallet_read on public.wallet_accounts for select to authenticated
  using (user_id = (select auth.uid()));
create policy goals_read on public.savings_goals for select to authenticated
  using (user_id = (select auth.uid()));
create policy transactions_read on public.wallet_transactions for select to authenticated
  using (user_id = (select auth.uid()));

-- All writes go through narrowly scoped server functions. No client can edit a role.
revoke all on public.profiles, public.wallet_accounts, public.savings_goals, public.wallet_transactions from anon, authenticated;
grant select on public.profiles, public.wallet_accounts, public.savings_goals, public.wallet_transactions to authenticated;

create function public.handle_new_saku_user() returns trigger
language plpgsql security definer set search_path = ''
as $$ begin
  insert into public.profiles(id, display_name, email, role)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 60), coalesce(new.email, ''), 'user');
  insert into public.wallet_accounts(user_id) values(new.id);
  return new;
end $$;
revoke all on function public.handle_new_saku_user() from public, anon, authenticated;
create trigger saku_user_created after insert on auth.users for each row execute function public.handle_new_saku_user();

create function public.sync_saku_email() returns trigger
language plpgsql security definer set search_path = ''
as $$ begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end $$;
revoke all on function public.sync_saku_email() from public, anon, authenticated;
create trigger saku_email_changed after update of email on auth.users for each row execute function public.sync_saku_email();

-- Initialize users created before this migration. Everyone starts as a normal user.
insert into public.profiles(id, display_name, email)
select id, left(coalesce(raw_user_meta_data->>'display_name', ''),60), coalesce(email,'') from auth.users;
insert into public.wallet_accounts(user_id) select id from auth.users;

create function public.wallet_snapshot() returns jsonb
language plpgsql stable security invoker set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  month_start date := date_trunc('month', now() at time zone 'Asia/Jakarta')::date;
  result jsonb;
begin
  if uid is null then raise exception 'Login diperlukan.'; end if;
  select jsonb_build_object(
    'balance', w.balance,
    'income', coalesce((select sum(amount) from public.wallet_transactions where user_id = uid and kind = 'income' and transaction_date >= month_start and transaction_date < (month_start + interval '1 month')::date),0),
    'expense', coalesce((select sum(amount) from public.wallet_transactions where user_id = uid and kind = 'expense' and transaction_date >= month_start and transaction_date < (month_start + interval '1 month')::date),0),
    'goals', coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'target',g.target,'saved',g.saved,'notes',g.notes) order by g.created_at,g.id) from public.savings_goals g where g.user_id=uid),'[]'::jsonb),
    'activities', coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'kind',t.kind,'amount',t.amount,'category',t.category,'date',to_char(t.transaction_date,'DD/MM/YYYY'),'notes',t.notes) order by t.transaction_date desc,t.created_at desc,t.id) from public.wallet_transactions t where t.user_id=uid),'[]'::jsonb)
  ) into result from public.wallet_accounts w where w.user_id=uid;
  if result is null then raise exception 'Akun dompet belum tersedia.'; end if;
  return result;
end $$;
revoke all on function public.wallet_snapshot() from public, anon;
grant execute on function public.wallet_snapshot() to authenticated;

create function public.wallet_mutate(
  p_kind text, p_amount bigint, p_name text default '', p_category text default '',
  p_date date default current_date, p_notes text default '', p_goal uuid default null, p_initial bigint default 0
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  available bigint;
  target_goal public.savings_goals%rowtype;
  title text;
  category text;
begin
  if uid is null then raise exception 'Login diperlukan.'; end if;
  if p_kind is null or p_kind not in ('income','expense','transfer','goal') then raise exception 'Transaksi tidak valid.'; end if;
  if p_amount is null or p_amount not between 1 and 999999999999 then raise exception 'Nominal tidak valid.'; end if;
  if p_initial is null or p_initial not between 0 and 999999999999 then raise exception 'Nominal tidak valid.'; end if;
  if p_notes is null or length(p_notes)>300 or p_date is null then raise exception 'Isian tidak valid.'; end if;
  if p_kind <> 'transfer' and (p_name is null or length(btrim(p_name)) not between 1 and 60) then raise exception 'Nama wajib diisi.'; end if;

  -- Serialize mutations per account, preventing two concurrent expenses overdrawing it.
  select balance into available from public.wallet_accounts where user_id=uid for update;
  if not found then raise exception 'Akun dompet belum tersedia.'; end if;

  if p_kind='goal' then
    if p_initial>p_amount then raise exception 'Nominal awal melebihi target.'; end if;
    if p_initial>available then raise exception 'Saldo tidak cukup.'; end if;
    insert into public.savings_goals(user_id,name,target,saved,notes) values(uid,btrim(p_name),p_amount,p_initial,p_notes);
    if p_initial>0 then
      update public.wallet_accounts set balance=balance-p_initial where user_id=uid;
      insert into public.wallet_transactions(user_id,kind,title,amount,category,transaction_date,notes)
      values(uid,'transfer','Tabungan '||btrim(p_name),p_initial,'Transfer ke Celengan',p_date,p_notes);
    end if;
  else
    if p_kind<>'income' and p_amount>available then raise exception 'Saldo tidak cukup.'; end if;
    if p_kind='transfer' then
      select * into target_goal from public.savings_goals where id=p_goal and user_id=uid for update;
      if not found then raise exception 'Target tabungan tidak ditemukan.'; end if;
      if p_amount>target_goal.target-target_goal.saved then raise exception 'Transfer melebihi sisa target.'; end if;
      update public.savings_goals set saved=saved+p_amount where id=target_goal.id;
      title := 'Tabungan '||target_goal.name;
      category := 'Transfer ke Celengan';
    else
      title := btrim(p_name);
      if p_kind='income' then category:='Pemasukan';
      else
        if p_category is null or p_category not in ('Makanan','Transportasi','Pendidikan','Hiburan','Belanja','Lainnya') then raise exception 'Kategori tidak valid.'; end if;
        category:=p_category;
      end if;
    end if;
    if p_kind='income' and available+p_amount>9000000000000 then raise exception 'Nominal tidak valid.'; end if;
    update public.wallet_accounts set balance=balance + case when p_kind='income' then p_amount else -p_amount end where user_id=uid;
    insert into public.wallet_transactions(user_id,kind,title,amount,category,transaction_date,notes)
    values(uid,p_kind,title,p_amount,category,p_date,p_notes);
  end if;
  return public.wallet_snapshot();
end $$;
revoke all on function public.wallet_mutate(text,bigint,text,text,date,text,uuid,bigint) from public, anon;
grant execute on function public.wallet_mutate(text,bigint,text,text,date,text,uuid,bigint) to authenticated;

create function public.admin_members()
returns table(id uuid, display_name text, email text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$ begin
  if not public.is_admin() then raise exception 'Akses admin diperlukan.' using errcode='42501'; end if;
  return query select p.id,p.display_name,p.email,p.role,p.created_at from public.profiles p order by p.created_at desc;
end $$;
revoke all on function public.admin_members() from public, anon;
grant execute on function public.admin_members() to authenticated;

commit;
