import type { Config } from "tailwindcss";
export default {
  content:["./src/**/*.{ts,tsx}"],
  theme:{
    extend:{
      borderRadius:{
        DEFAULT:"0.2rem",
        sm:"0.2rem",
        md:"0.25rem",
        lg:"0.375rem",
        xl:"0.5rem",
        "2xl":"0.625rem",
        "3xl":"0.75rem",
      },
    },
  },
  plugins:[],
} satisfies Config;
