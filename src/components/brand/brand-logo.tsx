import Image from "next/image";

export function BrandLogo({variant="horizontal",className="",priority=false,decorative=false}:{variant?:"horizontal"|"mark";className?:string;priority?:boolean;decorative?:boolean}){
  const mark=variant==="mark";
  return <Image src={mark?"/brand/menuly-mark.png":"/brand/menuly-logo-horizontal.png"} alt={decorative?"":"Menuly"} width={mark?512:1562} height={mark?512:471} priority={priority} className={`h-auto object-contain ${className}`}/>;
}
