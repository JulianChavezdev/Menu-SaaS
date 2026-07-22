import {z} from "zod";
import {MENU_TEMPLATES} from "./menu-templates";
import {ALLERGEN_CODES} from "./allergens";

export const MAX_BACKUP_BYTES=5*1024*1024;
const UUID=z.string().uuid();
const optionalText=(max:number)=>z.string().max(max).nullable().optional().transform(value=>value??null);
const translations=z.record(z.object({name:z.string().max(200).optional(),description:z.string().max(2000).optional()}).strict()).default({});
const timestamp=z.string().datetime({offset:true}).optional();
const templateKeys=Object.keys(MENU_TEMPLATES) as [string,...string[]];

const restaurantSchema=z.object({
  id:UUID,
  name:z.string().trim().min(1).max(200),
  slug:z.string().max(120),
  description:optionalText(3000),
  logo_url:optionalText(2048),
  phone:optionalText(100),
  email:optionalText(320),
  address:optionalText(500),
  instagram_url:optionalText(2048),
  website_url:optionalText(2048),
  currency:z.string().regex(/^[A-Z]{3}$/),
  locale:z.string().min(2).max(20),
  timezone:z.string().min(1).max(100),
  is_published:z.boolean(),
  language_switcher_enabled:z.boolean().default(false),
  menu_template:z.enum(templateKeys),
  translations,
}).strip();

const categorySchema=z.object({
  id:UUID,restaurant_id:UUID,name:z.string().trim().min(1).max(200),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  sort_order:z.number().int().min(-100000).max(100000),is_active:z.boolean(),translations,created_at:timestamp,updated_at:timestamp,
}).strip();

const productSchema=z.object({
  id:UUID,restaurant_id:UUID,category_id:UUID,name:z.string().trim().min(1).max(200),description:optionalText(3000),
  price_cents:z.number().int().min(0).max(100000000),video_url:optionalText(2048),video_path:optionalText(1024),
  image_url:optionalText(2048),image_path:optionalText(1024),allergens:z.array(z.enum(ALLERGEN_CODES)).max(14).default([]),is_available:z.boolean(),is_featured:z.boolean(),
  sort_order:z.number().int().min(-100000).max(100000),translations,created_at:timestamp,updated_at:timestamp,
}).strip();

const backupSchema=z.object({
  format:z.literal("carta-video.restaurant-backup"),version:z.literal(1),exportedAt:z.string().datetime({offset:true}),
  mediaFilesIncluded:z.literal(false),restaurant:restaurantSchema,categories:z.array(categorySchema).max(500),products:z.array(productSchema).max(5000),
}).strip();

export type RestaurantRestoreBackup=z.infer<typeof backupSchema>;

export class RestoreValidationError extends Error{
  constructor(message:string){super(message);this.name="RestoreValidationError"}
}

function repeated(values:string[]){return new Set(values).size!==values.length}

export function parseRestaurantBackup(input:unknown,targetRestaurantId:string){
  const parsed=backupSchema.safeParse(input);
  if(!parsed.success)throw new RestoreValidationError(parsed.error.issues[0]?.message??"La copia no es válida.");
  const backup=parsed.data;
  if(backup.restaurant.id!==targetRestaurantId)throw new RestoreValidationError("La copia pertenece a otro restaurante.");
  if(backup.categories.some(category=>category.restaurant_id!==targetRestaurantId)||backup.products.some(product=>product.restaurant_id!==targetRestaurantId))throw new RestoreValidationError("La copia contiene datos de otro restaurante.");
  if(repeated(backup.categories.map(category=>category.id))||repeated(backup.categories.map(category=>category.slug))||repeated(backup.products.map(product=>product.id)))throw new RestoreValidationError("La copia contiene identificadores o slugs duplicados.");
  const categories=new Set(backup.categories.map(category=>category.id));
  if(backup.products.some(product=>!categories.has(product.category_id)))throw new RestoreValidationError("Un producto apunta a una categoría que no existe en la copia.");
  return backup;
}

type CurrentRestaurant={name:string;description:string|null;logo_url:string|null;phone:string|null;email:string|null;address:string|null;instagram_url:string|null;website_url:string|null;currency:string;locale:string;timezone:string;is_published:boolean;language_switcher_enabled:boolean;menu_template:string;subscription_status:string};
const comparedFields=["name","description","logo_url","phone","email","address","instagram_url","website_url","currency","locale","timezone","is_published","language_switcher_enabled","menu_template"] as const;

export function buildRestorePreview(backup:RestaurantRestoreBackup,current:CurrentRestaurant,currentCategoryIds:string[],currentProductIds:string[]){
  const backupCategoryIds=new Set(backup.categories.map(item=>item.id));
  const backupProductIds=new Set(backup.products.map(item=>item.id));
  const changedSettings=comparedFields.filter(field=>backup.restaurant[field]!==current[field]);
  const mediaReferences=backup.products.filter(product=>product.video_url||product.video_path||product.image_url||product.image_path).length+(backup.restaurant.logo_url?1:0);
  const exceedsPlan=current.subscription_status!=="active"&&(backup.categories.length>0||backup.products.length>0);
  return{
    exportedAt:backup.exportedAt,
    sourceName:backup.restaurant.name,
    categories:{current:currentCategoryIds.length,backup:backup.categories.length,added:backup.categories.filter(item=>!currentCategoryIds.includes(item.id)).length,removed:currentCategoryIds.filter(id=>!backupCategoryIds.has(id)).length},
    products:{current:currentProductIds.length,backup:backup.products.length,added:backup.products.filter(item=>!currentProductIds.includes(item.id)).length,removed:currentProductIds.filter(id=>!backupProductIds.has(id)).length},
    changedSettings,
    mediaReferences,
    canApply:!exceedsPlan,
    warnings:["Los miembros, pagos, plan, suspensión, slug, analíticas y auditoría actuales se conservarán.",...(mediaReferences?["La copia contiene referencias a medios, pero no los archivos. Se conservarán las URLs y rutas existentes."]:[]),...(exceedsPlan?["Activa el Plan Carta antes de restaurar categorías o productos."]:[])],
  };
}
