import type { SVGProps } from "react";
type IconName =
  | "bag"
  | "scoop"
  | "flower"
  | "arrow"
  | "plus"
  | "minus"
  | "close"
  | "info"
  | "search";
export function MarshmallowIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {name === "bag" ? (
        <>
          <path d="M7 11h18l2 15H5z" />
          <path d="M11 12V9a5 5 0 0 1 10 0v3M12 19c2 3 6 3 8 0" />
        </>
      ) : name === "scoop" ? (
        <>
          <path d="m10 18 6 12 6-12M10 22h12M13 26h6" />
          <path d="M8 17a5 5 0 0 1 0-10 8 8 0 0 1 16 0 5 5 0 0 1 0 10Z" />
          <path d="M11 7c1-2 3-3 5-3" />
        </>
      ) : name === "flower" ? (
        <>
          <path d="M16 10c-8-13-16 0-7 6-13 8 0 16 7 7 8 13 16 0 7-7 13-8 0-16-7-6Z" />
          <circle cx="16" cy="16" r="3" />
        </>
      ) : name === "arrow" ? (
        <path d="M5 16h21M19 9l7 7-7 7" />
      ) : name === "plus" ? (
        <path d="M16 7v18M7 16h18" />
      ) : name === "minus" ? (
        <path d="M7 16h18" />
      ) : name === "search" ? (
        <>
          <circle cx="14" cy="14" r="8" />
          <path d="m20 20 7 7" />
        </>
      ) : name === "close" ? (
        <path d="m8 8 16 16M24 8 8 24" />
      ) : (
        <>
          <circle cx="16" cy="16" r="12" />
          <path d="M16 15v8M16 9h.01" />
        </>
      )}
    </svg>
  );
}
