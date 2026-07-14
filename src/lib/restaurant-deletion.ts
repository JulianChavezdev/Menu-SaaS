export function restaurantDeletionPhrase(slug:string){return `ELIMINAR ${slug}`}

export function matchesRestaurantDeletion({slug,typedPhrase,expectedEmail,typedEmail,acknowledged}:{slug:string;typedPhrase:string;expectedEmail:string;typedEmail:string;acknowledged:boolean}){
  return acknowledged&&typedPhrase===restaurantDeletionPhrase(slug)&&typedEmail.trim().toLowerCase()===expectedEmail.trim().toLowerCase();
}
