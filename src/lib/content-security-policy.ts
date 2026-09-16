export function contentSecurityPolicy(nonce:string,development=false){
  if(!/^[A-Za-z0-9+/=]+$/.test(nonce))throw new Error("Invalid CSP nonce");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development?" 'unsafe-eval'":""}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://*.supabase.co",
    "media-src 'self' blob: https://videos.pexels.com https://res.cloudinary.com https://*.supabase.co",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com${development?" ws:":""}`,
    "font-src 'self' data:","object-src 'none'","base-uri 'none'","form-action 'self'","frame-ancestors 'self'","worker-src 'self' blob:",
    ...development?[]:["upgrade-insecure-requests"]
  ].join("; ");
}
