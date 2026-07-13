export const MENU_TEMPLATES={
  cinematic:{key:"cinematic",name:"Cinemática",description:"Vídeo a pantalla completa con navegación vertical y controles flotantes.",tier:"free"},
  midnight:{key:"midnight",name:"Medianoche",description:"Una composición nocturna enmarcada, con cristal y acentos azul hielo.",tier:"premium"},
} as const;

export type MenuTemplateKey=keyof typeof MENU_TEMPLATES;
export const DEFAULT_MENU_TEMPLATE:MenuTemplateKey="cinematic";

export function isMenuTemplateKey(value:string):value is MenuTemplateKey{return value in MENU_TEMPLATES}
export function resolveMenuTemplate(value:string|undefined|null,allowPremium=true){
  const selected=MENU_TEMPLATES[isMenuTemplateKey(value??"")?value as MenuTemplateKey:DEFAULT_MENU_TEMPLATE];
  return selected.tier==="premium"&&!allowPremium?MENU_TEMPLATES[DEFAULT_MENU_TEMPLATE]:selected;
}
