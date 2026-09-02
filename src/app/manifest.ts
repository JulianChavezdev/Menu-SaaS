import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest{
  return {
    name:"Menuly",
    short_name:"Menuly",
    description:"Cartas digitales en vídeo para hostelería",
    start_url:"/",
    display:"standalone",
    background_color:"#FBF8F3",
    theme_color:"#0C1F30",
    icons:[{src:"/brand/menuly-mark-dark.png?v=2",sizes:"512x512",type:"image/png",purpose:"any"}],
    lang:"es",
    categories:["food","business"],
  };
}
