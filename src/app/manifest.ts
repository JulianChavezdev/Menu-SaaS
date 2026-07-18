import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest{
  return {
    name:"Carta Video",
    short_name:"Carta Video",
    description:"Cartas digitales en vídeo para hostelería",
    start_url:"/",
    display:"standalone",
    background_color:"#F8E7C9",
    theme_color:"#064E3B",
    lang:"es",
    categories:["food","business"],
  };
}
