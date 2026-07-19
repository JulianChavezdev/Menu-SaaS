create table if not exists public.restaurant_slug_aliases (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists restaurant_slug_aliases_restaurant_idx
on public.restaurant_slug_aliases(restaurant_id);

alter table public.restaurant_slug_aliases enable row level security;
revoke all on public.restaurant_slug_aliases from anon, authenticated;

create or replace function public.maintain_restaurant_slug_aliases()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.restaurant_slug_aliases alias
    where alias.slug = new.slug and alias.restaurant_id <> new.id
  ) then
    raise exception 'Restaurant slug is reserved by a previous URL' using errcode = '23505';
  end if;

  if tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    delete from public.restaurant_slug_aliases
    where slug = new.slug and restaurant_id = new.id;

    insert into public.restaurant_slug_aliases(slug, restaurant_id)
    values (old.slug, new.id);
  end if;

  return new;
end;
$$;

revoke all on function public.maintain_restaurant_slug_aliases() from public;

drop trigger if exists maintain_restaurant_slug_aliases on public.restaurants;
create trigger maintain_restaurant_slug_aliases
before insert or update of slug on public.restaurants
for each row execute function public.maintain_restaurant_slug_aliases();
