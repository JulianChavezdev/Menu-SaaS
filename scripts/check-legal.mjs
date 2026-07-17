import dotenv from "dotenv";

dotenv.config({path: ".env.local", quiet: true});

const required = [
  "NEXT_PUBLIC_LEGAL_NAME",
  "NEXT_PUBLIC_LEGAL_TAX_ID",
  "NEXT_PUBLIC_LEGAL_ADDRESS",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (!process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim() && !process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()) {
  missing.push("NEXT_PUBLIC_LEGAL_EMAIL (o NEXT_PUBLIC_CONTACT_EMAIL)");
}

if (missing.length) {
  console.error(`Textos legales no publicables. Faltan: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Identidad legal completa. Las rutas legales pueden publicarse.");
