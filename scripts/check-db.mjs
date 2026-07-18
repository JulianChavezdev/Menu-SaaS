import {createClient} from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({path:".env.local",quiet:true});

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
    run:()=>supabase.from("stripe_webhook_events").select("event_id",{head:true}).limit(1),
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
  {
    migration:"202607130005_superadmin_access.sql",
    run:async()=>{
      const results=await Promise.all([
        supabase.from("restaurants").select("access_suspended",{head:true}).limit(1),
        supabase.from("superadmin_audit_log").select("id",{head:true}).limit(1),
      ]);
      return {error:results.find(result=>result.error)?.error??null};
    },
  },
  {
    migration:"202607140001_manual_payments.sql",
    run:()=>supabase.from("manual_payments").select("id",{head:true}).limit(1),
  },
  {
    migration:"202607140002_manual_expiration_operations.sql",
    run:async()=>{
      const {error}=await supabase.rpc("process_manual_expirations",{grace_days:-1,suspend_access:false,actor_user:randomId});
      return {error:error?.code==="22023"?null:(error??new Error("Expiration validation did not run"))};
    },
  },
  {
    migration:"202607140003_privacy_safe_analytics.sql",
    run:async()=>{
      const {error}=await supabase.rpc("record_menu_analytics_event",{target_restaurant:randomId,target_product:null,target_event:"invalid",target_locale:"es"});
      return {error:error?.code==="22023"?null:(error??new Error("Analytics validation did not run"))};
    },
  },
  {
    migration:"202607140004_storage_upload_hardening.sql",
    run:()=>supabase.rpc("can_manage_restaurant_media",{object_name:"invalid"}),
  },
  {
    migration:"202607140005_platform_resource_metrics.sql",
    run:()=>supabase.rpc("get_platform_resource_metrics"),
  },
  {
    migration:"202607140006_restaurant_backup_restore.sql",
    run:async()=>{
      const {error}=await supabase.rpc("restore_restaurant_content",{target_restaurant:randomId,backup_restaurant:{},backup_categories:[],backup_products:[],actor_user:randomId});
      return {error:error?.code==="P0002"?null:(error??new Error("Restore validation did not run"))};
    },
  },
  {
    migration:"202607140007_automatic_restaurant_backups.sql",
    run:()=>supabase.from("restaurant_backups").select("id",{head:true}).limit(1),
  },
  {
    migration:"202607150001_extended_menu_analytics.sql",
    run:async()=>{
      const {error}=await supabase.rpc("record_menu_analytics_event",{target_restaurant:randomId,target_product:randomId,target_event:"cart_add",target_locale:"es"});
      return {error:error?.code==="42501"?null:(error??new Error("Extended analytics validation did not run"))};
    },
  },
  {
    migration:"202607150002_product_allergens.sql",
    run:()=>supabase.from("products").select("allergens",{head:true}).limit(1),
  },
  {
    migration:"202607160001_seven_day_trial.sql",
    run:async()=>{
      const results=await Promise.all([
        supabase.from("restaurants").select("publication_suspended_for_payment",{head:true}).limit(1),
        supabase.from("subscriptions").select("current_period_end",{head:true}).limit(1),
      ]);
      return {error:results.find(result=>result.error)?.error??null};
    },
  },
  {
    migration:"202607170001_product_images.sql",
    run:()=>supabase.rpc("can_manage_restaurant_product_image",{object_name:"invalid"}),
  },
  {
    migration:"202607170002_sales_growth.sql",
    run:async()=>{
      const results=await Promise.all([
        supabase.from("product_recommendations").select("id",{head:true}).limit(1),
        supabase.rpc("record_menu_analytics_event",{target_restaurant:randomId,target_product:randomId,target_event:"detail_open",target_locale:"es"}),
      ]);
      const analyticsError=results[1].error;
      return {error:results[0].error??(analyticsError?.code==="42501"?null:analyticsError)};
    },
  },
  {
    migration:"202607170003_restaurant_feedback.sql",
    run:()=>supabase.from("restaurant_feedback").select("id",{head:true}).limit(1),
  },
  {
    migration:"202607170004_analytics_goals.sql",
    run:()=>supabase.from("restaurant_analytics_goals").select("restaurant_id",{head:true}).limit(1),
  },
  {
    migration:"202607180001_automatic_video_posters.sql",
    run:()=>supabase.rpc("can_manage_restaurant_product_image",{object_name:"restaurants/00000000-0000-4000-8000-000000000000/products/00000000-0000-4000-8000-000000000000/image-auto-00000000-0000-4000-8000-000000000000.jpg"}),
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
