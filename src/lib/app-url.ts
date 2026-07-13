export function normalizedAppUrl(value=process.env.NEXT_PUBLIC_APP_URL){
  try{
    const url=new URL(value||"http://localhost:3000");
    return url.toString().replace(/\/$/,"");
  }catch{return "http://localhost:3000"}
}
