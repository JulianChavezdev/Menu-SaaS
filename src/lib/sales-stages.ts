export const SALES_STAGES=["new","contacted","interested","converted","not_continuing"] as const;
export type SalesStage=(typeof SALES_STAGES)[number];
export const SALES_STAGE_LABELS:Record<SalesStage,string>={new:"Nuevo",contacted:"Contactado",interested:"Interesado",converted:"Convertido",not_continuing:"No continúa"};

