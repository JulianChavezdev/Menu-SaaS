type ExportProduct={name?:unknown;description?:unknown;price_cents?:unknown;currency?:unknown;category?:unknown;allergens?:unknown;is_available?:unknown;is_featured?:unknown;video_url?:unknown;video_path?:unknown;translations?:unknown};

function csvCell(value:unknown){
  let text=value===null||value===undefined?"":typeof value==="object"?JSON.stringify(value):String(value);
  if(/^[=+\-@]/.test(text.trimStart()))text=`'${text}`;
  return `"${text.replaceAll('"','""')}"`;
}

export function safeExportName(slug:unknown){
  const value=String(slug??"restaurant").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"");
  return value||"restaurant";
}

export function productsCsv(products:ExportProduct[]){
  const headers=["categoría","producto","descripción","precio","moneda","alérgenos","disponible","destacado","vídeo_url","vídeo_path","traducciones"];
  const rows=products.map(product=>[
    product.category,product.name,product.description,(Number(product.price_cents??0)/100).toFixed(2),product.currency,product.allergens,Boolean(product.is_available),Boolean(product.is_featured),product.video_url,product.video_path,product.translations,
  ]);
  return `\uFEFF${[headers,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function restaurantBackup(payload:Record<string,unknown>){
  return JSON.stringify({format:"carta-video.restaurant-backup",version:1,exportedAt:new Date().toISOString(),mediaFilesIncluded:false,...payload},null,2);
}
