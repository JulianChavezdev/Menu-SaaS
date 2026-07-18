import type { Config } from "tailwindcss";
export default {
  content:["./src/**/*.{ts,tsx}"],
  theme:{
    extend:{
      colors:{
        orange:{50:"#fff7ed",100:"#FFD6A5",200:"#ffc98e",300:"#f3ad68",400:"#a366ff",500:"#812fff",600:"#6A00F4",700:"#5800cc",800:"#4600a3",900:"#35007a",950:"#240052"},
      },
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
