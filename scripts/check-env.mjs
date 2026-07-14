import dotenv from "dotenv";

dotenv.config({path:".env.local",quiet:true});

const production=process.argv.includes("--production");
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
const required=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_APP_URL"];
const errors=required.filter(name=>!process.env[name]).map(name=>`Falta ${name}.`);
if(!publicKey)errors.push("Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY heredada).");
if(!secretKey)errors.push("Falta SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY heredada).");

function parseUrl(name){
  const value=process.env[name];
  if(!value)return null;
  try{return new URL(value)}catch{errors.push(`${name} debe ser una URL absoluta.`);return null}
}

const supabaseUrl=parseUrl("NEXT_PUBLIC_SUPABASE_URL");
const appUrl=parseUrl("NEXT_PUBLIC_APP_URL");
if(supabaseUrl&&supabaseUrl.protocol!=="https:")errors.push("NEXT_PUBLIC_SUPABASE_URL debe usar HTTPS.");
if(production&&appUrl&&(appUrl.protocol!=="https:"||appUrl.hostname==="localhost"))errors.push("NEXT_PUBLIC_APP_URL debe ser el dominio HTTPS definitivo.");
if(publicKey&&publicKey===secretKey)errors.push("La clave pública y la secreta no pueden ser iguales.");
if(production&&!process.env.SUPERADMIN_EMAILS&&!process.env.SUPERADMIN_USER_IDS)errors.push("Configura SUPERADMIN_EMAILS o SUPERADMIN_USER_IDS.");
if(process.env.SUPERADMIN_RESTAURANT_CAPACITY){
  const capacity=Number(process.env.SUPERADMIN_RESTAURANT_CAPACITY);
  if(!Number.isInteger(capacity)||capacity<1||capacity>100_000)errors.push("SUPERADMIN_RESTAURANT_CAPACITY debe ser un entero entre 1 y 100000.");
}

const stripe=["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY","STRIPE_PLAN_PRICE_ID"];
const stripeConfigured=stripe.filter(name=>Boolean(process.env[name]));
if(stripeConfigured.length>0&&stripeConfigured.length<stripe.length)errors.push(`La configuración de Stripe está incompleta: ${stripe.filter(name=>!process.env[name]).join(", ")}.`);

if(errors.length){errors.forEach(error=>console.error(`ERROR  ${error}`));process.exit(1)}
console.log(production?"Production environment configuration is ready.":"Environment configuration is valid.");
