import type {NextConfig} from "next";

const development=process.env.NODE_ENV!=="production";
const deploymentId=(process.env.VERCEL_GIT_COMMIT_SHA||process.env.VERCEL_DEPLOYMENT_ID||"").replace(/[^a-zA-Z0-9_-]/g,"");
const securityHeaders=[
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
  devIndicators:false,
  images:{remotePatterns:[{protocol:"https",hostname:"images.unsplash.com"}]},
  async redirects(){return[{source:"/manual-carta-video-restaurantes.pdf",destination:"/manual-menuly-restaurantes.pdf",permanent:true}]},
  async headers(){return[
    {source:"/:path*",headers:securityHeaders},
    {source:"/sw.js",headers:[{key:"Cache-Control",value:"public, max-age=0, must-revalidate"},{key:"Service-Worker-Allowed",value:"/"}]},
    {source:"/manifests/:path*.webmanifest",headers:[{key:"Content-Type",value:"application/manifest+json"}]},
  ]},
};

export default nextConfig;
