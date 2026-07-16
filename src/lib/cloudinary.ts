import "server-only";
import {v2 as cloudinary} from "cloudinary";

export const CLOUDINARY_VIDEO_TRANSFORMATION="c_limit,w_720/q_auto:eco/vc_h264/f_mp4";

export function configuredCloudinary(){const cloud_name=process.env.CLOUDINARY_CLOUD_NAME;const api_key=process.env.CLOUDINARY_API_KEY;const api_secret=process.env.CLOUDINARY_API_SECRET;if(!cloud_name||!api_key||!api_secret)return null;cloudinary.config({cloud_name,api_key,api_secret,secure:true});return{client:cloudinary,cloudName:cloud_name,apiKey:api_key,apiSecret:api_secret}}
export function optimizedCloudinaryVideoUrl(publicId:string){const config=configuredCloudinary();if(!config)throw new Error("Cloudinary no está configurado.");return config.client.url(publicId,{resource_type:"video",secure:true,transformation:[{width:720,crop:"limit"},{quality:"auto:eco"},{video_codec:"h264"},{fetch_format:"mp4"}]})}
export async function destroyCloudinaryVideo(path:string){const config=configuredCloudinary();if(!config||!path.startsWith("cloudinary:"))return;await config.client.uploader.destroy(path.slice("cloudinary:".length),{resource_type:"video",invalidate:true})}
