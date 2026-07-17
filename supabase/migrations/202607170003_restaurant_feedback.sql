create table if not exists public.restaurant_feedback (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  category text not null default 'improvement' check (category in ('improvement','feature','problem','remove','other')),
  message text not null check (char_length(trim(message)) between 10 and 2000),
  status text not null default 'new' check (status in ('new','reviewed','planned','closed')),
  admin_note text check (char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurant_feedback_restaurant_created_idx on public.restaurant_feedback(restaurant_id,created_at desc);
create index if not exists restaurant_feedback_status_created_idx on public.restaurant_feedback(status,created_at desc);

drop trigger if exists set_restaurant_feedback_updated_at on public.restaurant_feedback;
create trigger set_restaurant_feedback_updated_at before update on public.restaurant_feedback
for each row execute function public.set_updated_at();

alter table public.restaurant_feedback enable row level security;
revoke all on public.restaurant_feedback from anon,authenticated;
grant select,insert on public.restaurant_feedback to authenticated;

drop policy if exists "Members read restaurant feedback" on public.restaurant_feedback;
create policy "Members read restaurant feedback" on public.restaurant_feedback for select to authenticated
using (public.is_member(restaurant_id));

drop policy if exists "Members submit restaurant feedback" on public.restaurant_feedback;
create policy "Members submit restaurant feedback" on public.restaurant_feedback for insert to authenticated
with check (public.is_member(restaurant_id) and user_id=auth.uid() and status='new' and admin_note is null);
