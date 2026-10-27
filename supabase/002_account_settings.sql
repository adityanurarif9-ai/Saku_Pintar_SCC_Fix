-- Account editing and owner-only avatar storage. Safe to rerun.
begin;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists avatar_style text not null default 'blue';
do $$ begin
  if not exists(select 1 from pg_constraint where conname='profiles_avatar_owner' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_avatar_owner check (avatar_path is null or (split_part(avatar_path,'/',1)=id::text and length(avatar_path)<=180));
  end if;
  if not exists(select 1 from pg_constraint where conname='profiles_avatar_style' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_avatar_style check (avatar_style in ('blue','green','purple','peach'));
  end if;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('saku-avatars','saku-avatars',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
do $$ begin
  if exists(select 1 from storage.buckets where id='saku-avatars' and public=true) then
    raise exception 'Bucket saku-avatars harus privat.';
  end if;
end $$;

drop policy if exists saku_avatars_read on storage.objects;
create policy saku_avatars_read on storage.objects for select to authenticated
  using(bucket_id='saku-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists saku_avatars_upload on storage.objects;
create policy saku_avatars_upload on storage.objects for insert to authenticated
  with check(bucket_id='saku-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists saku_avatars_delete on storage.objects;
create policy saku_avatars_delete on storage.objects for delete to authenticated
  using(bucket_id='saku-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.update_my_profile(p_name text,p_avatar_path text default null,p_avatar_style text default 'blue') returns jsonb
language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
  if uid is null then raise exception 'Login diperlukan.'; end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 60 then raise exception 'Nama harus 1 sampai 60 karakter.'; end if;
  if p_avatar_style is null or p_avatar_style not in ('blue','green','purple','peach') then raise exception 'Pilihan avatar tidak valid.'; end if;
  if p_avatar_path is not null then
    if p_avatar_path !~ ('^'||uid::text||'/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then raise exception 'Foto profil tidak valid.'; end if;
    if not exists(select 1 from storage.objects where bucket_id='saku-avatars' and name=p_avatar_path) then raise exception 'Foto profil belum terunggah.'; end if;
  end if;
  -- The caller never supplies another user ID, email, or role.
  update public.profiles p set display_name=btrim(p_name),avatar_path=p_avatar_path,avatar_style=p_avatar_style
  where p.id=uid returning to_jsonb(p) into result;
  if result is null then raise exception 'Profil tidak ditemukan.'; end if;
  return result;
end $$;
revoke all on function public.update_my_profile(text,text,text) from public,anon;
grant execute on function public.update_my_profile(text,text,text) to authenticated;
commit;
