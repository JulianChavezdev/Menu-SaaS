import type { Config } from "tailwindcss";
export default {
  content:["./src/**/*.{ts,tsx}"],
  theme:{
    extend:{
      colors:{
        orange:{50:"#fffaf1",100:"#F8E7C9",200:"#eed6ab",300:"#d9b986",400:"#3d7a67",500:"#1f6652",600:"#064E3B",700:"#053f31",800:"#043126",900:"#02241c",950:"#011a14"},
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
