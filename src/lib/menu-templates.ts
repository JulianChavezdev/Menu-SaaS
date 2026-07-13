export type TemplateTier="free"|"premium";
export type TemplateLayout="fullscreen"|"framed"|"editorial";
export type TemplateMotif="cinema"|"constellation"|"mediterranean"|"sakura"|"sol"|"deco"|"neon";

type MenuTemplate={
  key:string;
  name:string;
  description:string;
  tier:TemplateTier;
  layout:TemplateLayout;
  motif:TemplateMotif;
  colors:{background:string;panel:string;nav:string;accent:string;accent2:string;frame:string};
};

export const MENU_TEMPLATES={
  cinematic:{key:"cinematic",name:"Cinemática",description:"Vídeo inmersivo a pantalla completa con contraste cálido y lectura inmediata.",tier:"free",layout:"fullscreen",motif:"cinema",colors:{background:"#0b0b0a",panel:"#171715",nav:"#171715",accent:"#fcd34d",accent2:"#fb7185",frame:"rgba(255,255,255,.14)"}},
  mediterranean:{key:"mediterranean",name:"Brisa Mediterránea",description:"Azul costa, coral y ondas orgánicas para restaurantes frescos y luminosos.",tier:"free",layout:"editorial",motif:"mediterranean",colors:{background:"#062a3a",panel:"#0b4053",nav:"#073647",accent:"#7dd3fc",accent2:"#fb7185",frame:"rgba(125,211,252,.28)"}},
  midnight:{key:"midnight",name:"Medianoche",description:"Cristal oscuro, constelaciones y acentos azul hielo para una carta elegante.",tier:"premium",layout:"framed",motif:"constellation",colors:{background:"#050817",panel:"#090e27",nav:"#090e27",accent:"#a5f3fc",accent2:"#818cf8",frame:"rgba(165,243,252,.24)"}},
  sakura:{key:"sakura",name:"Sakura",description:"Pétalos, tinta ciruela y rosa suave para cocina japonesa y propuestas delicadas.",tier:"premium",layout:"editorial",motif:"sakura",colors:{background:"#2a1025",panel:"#451934",nav:"#351229",accent:"#fbcfe8",accent2:"#fb7185",frame:"rgba(251,207,232,.28)"}},
  taqueria:{key:"taqueria",name:"Taquería Solar",description:"Sol, papel picado y turquesa intenso para una experiencia alegre y callejera.",tier:"premium",layout:"fullscreen",motif:"sol",colors:{background:"#32140b",panel:"#642311",nav:"#4b1b10",accent:"#fde047",accent2:"#2dd4bf",frame:"rgba(253,224,71,.3)"}},
  artdeco:{key:"artdeco",name:"Bistró Art Déco",description:"Geometría dorada y verde botella para cartas sofisticadas con aire clásico.",tier:"premium",layout:"framed",motif:"deco",colors:{background:"#061d19",panel:"#0b3027",nav:"#08271f",accent:"#f5d78e",accent2:"#34d399",frame:"rgba(245,215,142,.34)"}},
  neon:{key:"neon",name:"Neón Urbano",description:"Retícula, magenta eléctrico y lima para burgers, cócteles y conceptos nocturnos.",tier:"premium",layout:"framed",motif:"neon",colors:{background:"#10051d",panel:"#210a36",nav:"#19082b",accent:"#f0abfc",accent2:"#bef264",frame:"rgba(240,171,252,.34)"}},
} as const satisfies Record<string,MenuTemplate>;

export type MenuTemplateKey=keyof typeof MENU_TEMPLATES;
export const DEFAULT_MENU_TEMPLATE:MenuTemplateKey="cinematic";

export function isMenuTemplateKey(value:string):value is MenuTemplateKey{return value in MENU_TEMPLATES}
export function resolveMenuTemplate(value:string|undefined|null,allowPremium=true){
  const selected=MENU_TEMPLATES[isMenuTemplateKey(value??"")?value as MenuTemplateKey:DEFAULT_MENU_TEMPLATE];
  return selected.tier==="premium"&&!allowPremium?MENU_TEMPLATES[DEFAULT_MENU_TEMPLATE]:selected;
}
