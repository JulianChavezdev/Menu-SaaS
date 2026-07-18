import type {NextConfig} from "next";

const development=process.env.NODE_ENV!=="production";
const deploymentId=(process.env.VERCEL_GIT_COMMIT_SHA||process.env.VERCEL_DEPLOYMENT_ID||"").replace(/[^a-zA-Z0-9_-]/g,"");
const contentSecurityPolicy=[
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${development?" 'unsafe-eval'":""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
  "media-src 'self' blob: https://videos.pexels.com https://res.cloudinary.com https://*.supabase.co",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com${development?" ws:":""}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "worker-src 'self' blob:",
  ...(!development?["upgrade-insecure-requests"]:[]),
].join("; ");

const securityHeaders=[
  {key:"Content-Security-Policy",value:contentSecurityPolicy},
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
  {key:"X-Frame-Options",value:"SAMEORIGIN"},
  {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
  {key:"Cross-Origin-Opener-Policy",value:"same-origin"},
  {key:"X-DNS-Prefetch-Control",value:"off"},
  ...(!development?[{key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"}]:[]),
];

const nextConfig:NextConfig={
  ...(deploymentId?{deploymentId}:{}),
  images:{remotePatterns:[{protocol:"https",hostname:"images.unsplash.com"}]},
  async headers(){return[{source:"/:path*",headers:securityHeaders}]},
};

export default nextConfig;
