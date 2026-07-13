import {createClient} from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({path:".env.local",quiet:true});

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!key){
  console.error("Supabase configuration is missing. Run npm run check:env first.");
  process.exit(1);
}

const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const randomId="00000000-0000-4000-8000-000000000000";
const checks=[
  {
    migration:"202607120002_language_switcher.sql",
    run:()=>supabase.from("restaurants").select("language_switcher_enabled",{head:true}).limit(1),
  },
  {
    migration:"202607130001_menu_templates.sql",
    run:()=>supabase.from("restaurants").select("menu_template",{head:true}).limit(1),
  },
  {
    migration:"202607130002_stripe_webhook_events.sql",
    run:()=>supabase.from("stripe_webhook_events").select("id",{head:true}).limit(1),
  },
  {
    migration:"202607130003_content_translations.sql",
    run:async()=>{
      const results=await Promise.all([
        supabase.from("restaurants").select("translations",{head:true}).limit(1),
        supabase.from("categories").select("translations",{head:true}).limit(1),
        supabase.from("products").select("translations",{head:true}).limit(1),
      ]);
      return {error:results.find(result=>result.error)?.error??null};
    },
  },
  {
    migration:"202607130004_security_hardening.sql",
    run:()=>supabase.rpc("is_published_restaurant",{target:randomId}),
  },
];

const pending=[];
for(const check of checks){
  const {error}=await check.run();
  if(error){
    pending.push(check.migration);
    console.error(`PENDING  ${check.migration}`);
  }else console.log(`OK       ${check.migration}`);
}

if(pending.length){
  console.error(`\nApply ${pending.length} pending migration${pending.length===1?"":"s"} from supabase/migrations.`);
  process.exit(1);
}
console.log("\nDatabase schema is ready.");
