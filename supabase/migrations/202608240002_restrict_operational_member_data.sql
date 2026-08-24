drop policy if exists "members subscriptions" on public.subscriptions;
create policy "management reads subscriptions" on public.subscriptions
for select to authenticated using (public.can_edit(restaurant_id));

drop policy if exists "members read menu analytics" on public.menu_analytics_daily;
create policy "management reads menu analytics" on public.menu_analytics_daily
for select to authenticated using (public.can_edit(restaurant_id));

drop policy if exists "Members read restaurant feedback" on public.restaurant_feedback;
create policy "Management reads restaurant feedback" on public.restaurant_feedback
for select to authenticated using (public.can_edit(restaurant_id));

drop policy if exists "Members submit restaurant feedback" on public.restaurant_feedback;
create policy "Management submits restaurant feedback" on public.restaurant_feedback
for insert to authenticated
with check (public.can_edit(restaurant_id) and user_id = auth.uid() and status = 'new' and admin_note is null);

drop policy if exists "Members read analytics goals" on public.restaurant_analytics_goals;
drop policy if exists "Members create analytics goals" on public.restaurant_analytics_goals;
drop policy if exists "Members update analytics goals" on public.restaurant_analytics_goals;
create policy "Management reads analytics goals" on public.restaurant_analytics_goals
for select to authenticated using (public.can_edit(restaurant_id));
create policy "Management creates analytics goals" on public.restaurant_analytics_goals
for insert to authenticated with check (public.can_edit(restaurant_id));
create policy "Management updates analytics goals" on public.restaurant_analytics_goals
for update to authenticated using (public.can_edit(restaurant_id)) with check (public.can_edit(restaurant_id));
