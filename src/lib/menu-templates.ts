export type TemplateTier="free"|"premium";
export type TemplateLayout="fullscreen"|"framed"|"editorial";
export type TemplateMotif="cinema"|"constellation"|"mediterranean"|"sakura"|"sol"|"deco"|"neon"|"noirluxe";

type MenuTemplate={
  key:string;
  name:string;
  description:string;
  tier:TemplateTier;
  layout:TemplateLayout;
  motif:TemplateMotif;
  colors:{background:string;panel:string;nav:string;accent:string;accent2:string;frame:string};
};

const cinematicTemplate:MenuTemplate&{key:"cinematic"}={key:"cinematic",name:"Cinemática",description:"Vídeo limpio a pantalla completa con el HUD flotante como único elemento visual.",tier:"free",layout:"fullscreen",motif:"cinema",colors:{background:"#0b0b0a",panel:"#171715",nav:"#171715",accent:"#fcd34d",accent2:"#fb7185",frame:"rgba(255,255,255,.14)"}};
const noirLuxeTemplate:MenuTemplate&{key:"noirluxe"}={key:"noirluxe",name:"NoirLuxe",description:"Fotografía protagonista, negro profundo y tipografía editorial dorada para una carta gastronómica sofisticada.",tier:"premium",layout:"fullscreen",motif:"noirluxe",colors:{background:"#111111",panel:"#111111",nav:"#111111",accent:"#C9A96E",accent2:"#F0E9DB",frame:"rgba(201,169,110,.33)"}};

export const MENU_TEMPLATES={cinematic:cinematicTemplate,noirluxe:noirLuxeTemplate} as const;

export type MenuTemplateKey=keyof typeof MENU_TEMPLATES;
export const DEFAULT_MENU_TEMPLATE:MenuTemplateKey="cinematic";

export function isMenuTemplateKey(value:string):value is MenuTemplateKey{return value in MENU_TEMPLATES}
export function resolveMenuTemplate(value:string|undefined|null,allowPremium=true){
  const selected=MENU_TEMPLATES[isMenuTemplateKey(value??"")?value as MenuTemplateKey:DEFAULT_MENU_TEMPLATE];
  return selected.tier==="premium"&&!allowPremium?MENU_TEMPLATES[DEFAULT_MENU_TEMPLATE]:selected;
}
