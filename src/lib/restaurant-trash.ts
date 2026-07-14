export const RESTAURANT_RESTORE_DAYS=30;
export const RESTAURANT_RESTORE_WINDOW_MS=RESTAURANT_RESTORE_DAYS*24*60*60*1000;

export function restaurantRestoreDeadline(deletedAt:string|Date){return new Date(new Date(deletedAt).getTime()+RESTAURANT_RESTORE_WINDOW_MS)}
export function isRestaurantTrashRestorable(deletedAt:string|Date,now=new Date()){const deleted=new Date(deletedAt);return !Number.isNaN(deleted.getTime())&&deleted<=now&&restaurantRestoreDeadline(deleted)>now}
