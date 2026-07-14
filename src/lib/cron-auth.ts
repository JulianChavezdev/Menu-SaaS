import {timingSafeEqual} from "node:crypto";

export function isValidCronAuthorization(authorization:string|null,secret:string|undefined){
  if(!authorization||!secret)return false;
  const received=Buffer.from(authorization);
  const expected=Buffer.from(`Bearer ${secret}`);
  return received.length===expected.length&&timingSafeEqual(received,expected);
}
