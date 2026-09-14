import {subscriptionHasAccess} from "./plans";

export function canUploadRestaurantMedia(role:string,restaurant:{access_suspended?:boolean;subscription_status:string}|null){
  return ["owner","admin","editor"].includes(role)
    && Boolean(restaurant&&!restaurant.access_suspended&&subscriptionHasAccess(restaurant.subscription_status));
}
