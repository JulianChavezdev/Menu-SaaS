export const MENU_TEMPLATES={
  cinematic:{key:"cinematic",name:"Cinemática",description:"Vídeo a pantalla completa con navegación vertical y controles flotantes.",tier:"free"},
} as const;

export type MenuTemplateKey=keyof typeof MENU_TEMPLATES;
export const DEFAULT_MENU_TEMPLATE:MenuTemplateKey="cinematic";

export function isMenuTemplateKey(value:string):value is MenuTemplateKey{return value in MENU_TEMPLATES}
export function resolveMenuTemplate(value:string|undefined|null){return MENU_TEMPLATES[isMenuTemplateKey(value??"")?value as MenuTemplateKey:DEFAULT_MENU_TEMPLATE]}
