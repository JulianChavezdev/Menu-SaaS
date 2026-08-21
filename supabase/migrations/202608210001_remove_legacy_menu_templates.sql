update public.restaurants
set menu_template = 'noirluxe'
where menu_template is distinct from 'noirluxe';

alter table public.restaurants
alter column menu_template set default 'noirluxe';

comment on column public.restaurants.menu_template is
'Plantilla pública única de Menuly. El valor vigente es noirluxe.';
