alter type public.member_role add value if not exists 'waiter';
alter type public.member_role add value if not exists 'kitchen';

comment on type public.member_role is
  'Restaurant access roles. Waiter and kitchen are restricted operational accounts.';
