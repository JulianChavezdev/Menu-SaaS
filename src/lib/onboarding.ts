export type OnboardingInput={hasLogo:boolean;hasContact:boolean;categories:number;products:number;media:number;published:boolean};

export function restaurantOnboarding(input:OnboardingInput){
  const steps=[
    {id:"identity",label:"Añade tu logo",description:"Haz que la carta se reconozca al abrirla.",href:"/dashboard/appearance",done:input.hasLogo},
    {id:"contact",label:"Completa los datos del local",description:"Dirección o teléfono para que puedan encontrarte.",href:"/dashboard/restaurant",done:input.hasContact},
    {id:"catalog",label:"Crea tu primer producto",description:input.categories?"Añade nombre, precio y categoría.":"Crea una categoría y tu primer producto.",href:"/dashboard/menu",done:input.products>0&&input.categories>0},
    {id:"media",label:"Añade una foto o vídeo",description:"El contenido visual es el centro de tu carta.",href:"/dashboard/menu",done:input.media>0},
    {id:"publish",label:"Publica y comprueba la carta",description:"Actívala y revísala como cliente.",href:"/dashboard/restaurant",done:input.published},
  ];
  const completed=steps.filter(step=>step.done).length;
  return{steps,completed,total:steps.length,percentage:Math.round(completed/steps.length*100),complete:completed===steps.length,next:steps.find(step=>!step.done)??null};
}
