import type {Restaurant} from "./types";
import {subscriptionHasAccess} from "./plans";

export function isMenuPublic(restaurant:{is_published:boolean;access_suspended?:boolean;publication_suspended_for_payment?:boolean;subscription_status?:string}){
  return restaurant.is_published&&!restaurant.access_suspended&&!restaurant.publication_suspended_for_payment
    &&subscriptionHasAccess(restaurant.subscription_status??"");
}

// Explicit projection: new administrative columns must never reach client props.
export function publicMenuRestaurant(restaurant:Restaurant):Restaurant{
  return {
    id:restaurant.id,name:restaurant.name,slug:restaurant.slug,
    description:restaurant.description,translations:restaurant.translations,
    logo_url:restaurant.logo_url,cover_url:restaurant.cover_url,
    primary_color:restaurant.primary_color,secondary_color:restaurant.secondary_color,
    currency:restaurant.currency,locale:restaurant.locale,is_published:restaurant.is_published,
    language_switcher_enabled:restaurant.language_switcher_enabled,menu_template:restaurant.menu_template,
    subscription_status:restaurant.subscription_status,
    phone:restaurant.phone,address:restaurant.address,email:restaurant.email,
    instagram_url:restaurant.instagram_url,website_url:restaurant.website_url,
  };
}
