import dotenv from "dotenv";

dotenv.config({path:".env.local",quiet:true});

const production=process.argv.includes("--production");
const required=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_APP_URL"];
const errors=required.filter(name=>!process.env[name]).map(name=>`Falta ${name}.`);

function parseUrl(name){
  const value=process.env[name];
  if(!value)return null;
  try{return new URL(value)}catch{errors.push(`${name} debe ser una URL absoluta.`);return null}
}

const supabaseUrl=parseUrl("NEXT_PUBLIC_SUPABASE_URL");
const appUrl=parseUrl("NEXT_PUBLIC_APP_URL");
if(supabaseUrl&&supabaseUrl.protocol!=="https:")errors.push("NEXT_PUBLIC_SUPABASE_URL debe usar HTTPS.");
if(production&&appUrl&&(appUrl.protocol!=="https:"||appUrl.hostname==="localhost"))errors.push("NEXT_PUBLIC_APP_URL debe ser el dominio HTTPS definitivo.");
if(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY===process.env.SUPABASE_SERVICE_ROLE_KEY)errors.push("La clave pública y la service role no pueden ser iguales.");
if(production&&!process.env.SUPERADMIN_EMAILS&&!process.env.SUPERADMIN_USER_IDS)errors.push("Configura SUPERADMIN_EMAILS o SUPERADMIN_USER_IDS.");

const stripe=["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY","STRIPE_PLAN_PRICE_ID"];
const stripeConfigured=stripe.filter(name=>Boolean(process.env[name]));
if(stripeConfigured.length>0&&stripeConfigured.length<stripe.length)errors.push(`La configuración de Stripe está incompleta: ${stripe.filter(name=>!process.env[name]).join(", ")}.`);

if(errors.length){errors.forEach(error=>console.error(`ERROR  ${error}`));process.exit(1)}
console.log(production?"Production environment configuration is ready.":"Environment configuration is valid.");
