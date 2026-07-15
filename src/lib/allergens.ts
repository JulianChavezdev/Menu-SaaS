export const ALLERGEN_CODES=["gluten","crustaceans","eggs","fish","peanuts","soy","milk","nuts","celery","mustard","sesame","sulphites","lupin","molluscs"] as const;

export type AllergenCode=typeof ALLERGEN_CODES[number];

export const ALLERGENS:Record<AllergenCode,{es:string;en:string}>={
  gluten:{es:"Gluten",en:"Gluten"},
  crustaceans:{es:"Crustáceos",en:"Crustaceans"},
  eggs:{es:"Huevos",en:"Eggs"},
  fish:{es:"Pescado",en:"Fish"},
  peanuts:{es:"Cacahuetes",en:"Peanuts"},
  soy:{es:"Soja",en:"Soy"},
  milk:{es:"Leche",en:"Milk"},
  nuts:{es:"Frutos de cáscara",en:"Tree nuts"},
  celery:{es:"Apio",en:"Celery"},
  mustard:{es:"Mostaza",en:"Mustard"},
  sesame:{es:"Sésamo",en:"Sesame"},
  sulphites:{es:"Sulfitos",en:"Sulphites"},
  lupin:{es:"Altramuces",en:"Lupin"},
  molluscs:{es:"Moluscos",en:"Molluscs"},
};

export function allergenLabel(code:AllergenCode,language:"es"|"en"){
  return ALLERGENS[code][language];
}
