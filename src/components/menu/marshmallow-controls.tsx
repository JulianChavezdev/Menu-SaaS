import type {SVGProps} from "react";

export function MarshmallowIcon({kind,...props}:SVGProps<SVGSVGElement>&{kind:"add"|"bag"|"scoop"}){
  return <svg viewBox="0 0 32 32" width={26} height={26} fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {kind==="add"?<><path d="M16 3c5-3 10 1 10 5 6 1 7 7 3 11 2 5-2 10-7 9-3 5-10 5-13 0-6 1-10-5-7-10-3-5 0-10 5-11 0-4 5-6 9-4Z" fill="#F4C6D6"/><path d="M16 10v12M10 16h12"/></>:kind==="bag"?<><path d="M7 12h18l2 15H5Z" fill="#DBE7CE"/><path d="M11 13V9a5 5 0 0 1 10 0v4M12 21c2 2 6 2 8 0"/></>:<><path d="m10 18 6 12 6-12M12 23h8" fill="#EFD8B5"/><path d="M8 17a5 5 0 0 1 0-10 8 8 0 0 1 16 0 5 5 0 0 1 0 10Z" fill="#F4C6D6"/><path d="M12 7c1-2 3-3 5-2"/></>}
  </svg>;
}
