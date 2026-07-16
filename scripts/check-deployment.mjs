const args=process.argv.slice(2);
const input=args.find(argument=>!argument.startsWith("--"))||process.env.DEPLOYMENT_URL;
const requireFeatures=args.includes("--require-features");
if(!input){
  console.error("Uso: npm run check:deployment -- https://tu-dominio.com");
  process.exit(1);
}

let origin;
try{
  const parsed=new URL(input);
  if(parsed.protocol!=="https:"&&parsed.hostname!=="localhost")throw new Error();
  origin=parsed.origin;
}catch{
  console.error("La URL debe ser absoluta y usar HTTPS (salvo localhost).");
  process.exit(1);
}

const checks=[
  {path:"/api/health",type:"application/json"},
  {path:"/",type:"text/html",security:true},
  {path:"/r/bistro-nube",type:"text/html",security:true},
  {path:"/manifest.webmanifest",type:"application/manifest+json"},
  {path:"/robots.txt",type:"text/plain"},
  {path:"/sitemap.xml",type:"application/xml"},
];

const failures=[];
for(const check of checks){
  try{
    const response=await fetch(`${origin}${check.path}`,{headers:{"User-Agent":"CartaVideo-Deployment-Check/1.0"},redirect:"follow",signal:AbortSignal.timeout(10_000)});
    const contentType=response.headers.get("content-type")??"";
    if(!response.ok)failures.push(`${check.path}: HTTP ${response.status}`);
    if(!contentType.includes(check.type))failures.push(`${check.path}: Content-Type inesperado (${contentType||"vacío"})`);
    if(check.path==="/api/health"){
      const payload=await response.json().catch(()=>null);
      if(payload?.status!=="ok")failures.push(`${check.path}: estado ${payload?.status??"inválido"}`);
      const features=payload?.features??{};
      console.log(`      traducción automática: ${features.automatic_translation?"activa":"inactiva"}`);
      console.log(`      mantenimiento programado: ${features.scheduled_maintenance?"activo":"inactivo"}`);
      if(requireFeatures&&!features.automatic_translation)failures.push(`${check.path}: traducción automática inactiva (falta DEEPL_API_KEY)`);
      if(requireFeatures&&!features.scheduled_maintenance)failures.push(`${check.path}: mantenimiento programado inactivo (falta CRON_SECRET)`);
      if(!response.headers.get("cache-control")?.includes("no-store"))failures.push(`${check.path}: falta Cache-Control no-store`);
    }
    if(check.security){
      if(!response.headers.get("content-security-policy"))failures.push(`${check.path}: falta Content-Security-Policy`);
      if(response.headers.get("x-content-type-options")!=="nosniff")failures.push(`${check.path}: falta X-Content-Type-Options`);
    }
    console.log(`${response.ok?"OK  ":"FAIL"}  ${response.status}  ${check.path}`);
  }catch(error){
    failures.push(`${check.path}: ${error instanceof Error?error.message:"error de red"}`);
    console.error(`FAIL       ${check.path}`);
  }
}

if(failures.length){
  failures.forEach(failure=>console.error(`ERROR  ${failure}`));
  process.exit(1);
}
console.log(`\nDespliegue saludable en ${origin}.`);
