import { z } from "zod";
const id = z.string().uuid();
export const customizationSchema = z.object({
  enabled: z.boolean(),
  groups: z.array(z.object({
    id, name: z.string().trim().min(1).max(70),
    min: z.number().int().min(0).max(30), max: z.number().int().min(1).max(30),
    options: z.array(z.object({
      id, name: z.string().trim().min(1).max(70),
      imageUrl: z.string().max(2000).url().refine(v=>v.startsWith("https://"),"La foto debe usar HTTPS").nullable().default(null),
      priceCents: z.number().int().min(0).max(100000).default(0), available:z.boolean().default(true),
    })).min(1).max(30),
  })).max(6),
}).superRefine((value,ctx)=>{
  if(value.enabled&&!value.groups.length)ctx.addIssue({code:"custom",message:"Añade al menos un grupo de opciones"});
  const ids=new Set<string>();
  for(const group of value.groups){
    if(group.min>group.max||group.max>group.options.length)ctx.addIssue({code:"custom",message:`Revisa los límites de ${group.name}`});
    for(const item of [group,...group.options]){if(ids.has(item.id))ctx.addIssue({code:"custom",message:"Hay opciones repetidas"});ids.add(item.id)}
  }
});
export type ProductCustomization=z.infer<typeof customizationSchema>;
export const selectionSchema=z.array(z.object({groupId:id,optionIds:z.array(id).max(30)})).max(6);
export type CustomizationSelection=z.infer<typeof selectionSchema>;
export type OptionSnapshot={groupId:string;groupName:string;optionId:string;name:string;priceCents:number};
export const emptyCustomization:ProductCustomization={enabled:false,groups:[]};
export function resolveCustomization(config:ProductCustomization|null|undefined,selection:CustomizationSelection=[]){
  if(!selectionSchema.safeParse(selection).success)throw new Error("Selección de opciones no válida");
  if(!config?.enabled){if(selection.length)throw new Error("Este producto ya no admite personalización. Vuelve a añadirlo.");return{extraCents:0,options:[] as OptionSnapshot[]}}
  if(!customizationSchema.safeParse(config).success)throw new Error("La personalización de este producto no está disponible");
  if(new Set(selection.map(s=>s.groupId)).size!==selection.length||selection.some(s=>!config.groups.some(g=>g.id===s.groupId)))throw new Error("Grupo de opciones no válido");
  const options:OptionSnapshot[]=[];
  for(const group of config.groups){
    const chosen=selection.find(s=>s.groupId===group.id)?.optionIds??[];
    if(new Set(chosen).size!==chosen.length)throw new Error("No puedes repetir una opción");
    if(chosen.length<group.min||chosen.length>group.max)throw new Error(`${group.name}: elige ${group.min===group.max?group.max:`entre ${group.min} y ${group.max}`} opciones`);
    for(const optionId of chosen){const item=group.options.find(o=>o.id===optionId);if(!item?.available)throw new Error(`${group.name}: una opción ya no está disponible`);options.push({groupId:group.id,groupName:group.name,optionId:item.id,name:item.name,priceCents:item.priceCents})}
  }
  return{extraCents:options.reduce((sum,o)=>sum+o.priceCents,0),options};
}
export function selectionKey(selection:CustomizationSelection=[]){return selection.filter(g=>g.optionIds.length).map(g=>`${g.groupId}:${[...g.optionIds].sort().join(",")}`).sort().join("|")}
