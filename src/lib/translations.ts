export type TranslationFields={name?:string;description?:string};
export type TranslationMap=Record<string,TranslationFields>;

export function mergeTranslation(current:unknown,locale:string,fields:TranslationFields):TranslationMap{
  const translations=current&&typeof current==="object"&&!Array.isArray(current)?{...(current as TranslationMap)}:{};
  const clean=Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,value?.trim()]).filter(([,value])=>Boolean(value))) as TranslationFields;
  if(Object.keys(clean).length)translations[locale]=clean;else delete translations[locale];
  return translations;
}

export function translatedField(source:{translations?:TranslationMap|null},field:keyof TranslationFields,locale:"es"|"en",fallback:string|null|undefined){
  if(locale==="es")return fallback??"";
  return source.translations?.[locale]?.[field]?.trim()||fallback||"";
}
