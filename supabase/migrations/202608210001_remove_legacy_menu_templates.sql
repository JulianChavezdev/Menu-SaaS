update public.restaurants
set menu_template = 'cinematic'
where menu_template not in ('cinematic', 'noirluxe');

alter table public.restaurants
alter column menu_template set default 'cinematic';

comment on column public.restaurants.menu_template is
'Plantilla pública de Menuly. Valores vigentes: cinematic y noirluxe.';
