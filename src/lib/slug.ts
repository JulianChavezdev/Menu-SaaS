export function slugify(value:string){return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export function isValidSlug(value:string){return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)}
