import dotenv from "dotenv";dotenv.config({path:".env.local"});
const required=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_APP_URL"];
const missing=required.filter(name=>!process.env[name]);
if(missing.length){console.error(`Missing required environment variables: ${missing.join(", ")}`);process.exit(1)}
for(const name of ["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_APP_URL"]){try{new URL(process.env[name])}catch{console.error(`${name} must be a valid absolute URL`);process.exit(1)}}
console.log("Environment configuration is valid.");
