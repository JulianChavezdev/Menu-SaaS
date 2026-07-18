import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest{
  return {
    name:"Carta Video",
    short_name:"Carta Video",
    description:"Cartas digitales en vídeo para hostelería",
    start_url:"/",
    display:"standalone",
    background_color:"#090b18",
    theme_color:"#090b18",
    lang:"es",
    categories:["food","business"],
  };
}
