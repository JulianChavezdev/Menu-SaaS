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

const principalTemplate:MenuTemplate&{key:"noirluxe"}={key:"noirluxe",name:"Principal",description:"Fotografía protagonista, negro profundo y tipografía editorial dorada para una carta gastronómica sofisticada.",tier:"free",layout:"fullscreen",motif:"noirluxe",colors:{background:"#111111",panel:"#111111",nav:"#111111",accent:"#c9a96e",accent2:"#f0e9db",frame:"rgba(201,169,110,.34)"}};

export const MENU_TEMPLATES={noirluxe:principalTemplate} as const;

export type MenuTemplateKey=keyof typeof MENU_TEMPLATES;
export const DEFAULT_MENU_TEMPLATE:MenuTemplateKey="noirluxe";

export function isMenuTemplateKey(value:string):value is MenuTemplateKey{return value in MENU_TEMPLATES}
export function resolveMenuTemplate(value:string|undefined|null,allowPremium=true){
  const selected=MENU_TEMPLATES[isMenuTemplateKey(value??"")?value as MenuTemplateKey:DEFAULT_MENU_TEMPLATE];
  return selected.tier==="premium"&&!allowPremium?MENU_TEMPLATES[DEFAULT_MENU_TEMPLATE]:selected;
}
