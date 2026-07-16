import type { Config } from "tailwindcss";
export default {
  content:["./src/**/*.{ts,tsx}"],
  theme:{
    extend:{
      borderRadius:{
        DEFAULT:"0.125rem",
        sm:"0.125rem",
        md:"0.15rem",
        lg:"0.2rem",
        xl:"0.25rem",
        "2xl":"0.3rem",
        "3xl":"0.375rem",
        full:"0.375rem",
      },
    },
  },
  plugins:[],
} satisfies Config;
