export type LegalIdentity = {
  name: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
  registry: string;
  complete: boolean;
};

const value = (name: string) => process.env[name]?.trim() ?? "";

export function getLegalIdentity(): LegalIdentity {
  const identity = {
    name: value("NEXT_PUBLIC_LEGAL_NAME"),
    taxId: value("NEXT_PUBLIC_LEGAL_TAX_ID"),
    address: value("NEXT_PUBLIC_LEGAL_ADDRESS"),
    email: value("NEXT_PUBLIC_LEGAL_EMAIL") || value("NEXT_PUBLIC_CONTACT_EMAIL"),
    phone: value("NEXT_PUBLIC_LEGAL_PHONE"),
    registry: value("NEXT_PUBLIC_LEGAL_REGISTRY"),
  };

  return {
    ...identity,
    complete: Boolean(identity.name && identity.taxId && identity.address && identity.email),
  };
}

export const LEGAL_UPDATED_AT = "17 de julio de 2026";

export const legalLinks = [
  {href: "/legal", label: "Aviso legal"},
  {href: "/privacidad", label: "Privacidad"},
  {href: "/cookies", label: "Cookies"},
  {href: "/condiciones", label: "Condiciones"},
  {href: "/encargo-datos", label: "Encargo de datos"},
];
