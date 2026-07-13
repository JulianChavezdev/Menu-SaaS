import type { NextConfig } from "next";
const securityHeaders=[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"X-Frame-Options",value:"SAMEORIGIN"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},{key:"Cross-Origin-Opener-Policy",value:"same-origin"},{key:"X-DNS-Prefetch-Control",value:"off"},...(process.env.NODE_ENV==="production"?[{key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"}]:[])];
const nextConfig: NextConfig = { images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },async headers(){return [{source:"/:path*",headers:securityHeaders}]}};
export default nextConfig;
