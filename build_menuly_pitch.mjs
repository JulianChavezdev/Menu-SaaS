import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "file:///C:/Users/julic/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname);
const OUT_DIR = path.join(ROOT, "outputs");
const ASSET_DIR = path.join(ROOT, "presentation_assets");

const IMG_COVER = path.join(
  ASSET_DIR,
  "call_vxqDUBkHG2ikVkBEKTMrrKs5.png",
);
const IMG_COMPARE = path.join(
  ASSET_DIR,
  "call_ldrPQBWxzNZZHqYkB7Z63SJp.png",
);
const IMG_SPAIN = path.join(
  ASSET_DIR,
  "call_dS5I4i4lZsIC5q0MnaZOriiB.png",
);
const IMG_BOARD = path.join(
  ASSET_DIR,
  "call_QQWTjVOjdrlxYbn3x3RGpjIS.png",
);

const COLORS = {
  navy: "#0C1F30",
  coral: "#F0643A",
  ivory: "#FBF8F3",
  graphite: "#374151",
  white: "#FFFFFF",
  muted: "#64748B",
  light: "#E8E1D7",
  panel: "#F7F2EB",
  darkPanel: "#10263A",
};

const W = 1280;
const H = 720;
const M = 64;

function shape(slide, geometry, x, y, w, h, opts = {}) {
  return slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill: opts.fill ?? "none",
    line: opts.line ?? { style: "solid", fill: "none", width: 0 },
    borderRadius: opts.borderRadius,
    shadow: opts.shadow,
  });
}

function textbox(
  slide,
  x,
  y,
  w,
  h,
  text,
  style = {},
  opts = {},
) {
  const box = shape(slide, "textbox", x, y, w, h, opts);
  box.text = text;
  box.text.style = {
    fontFace: style.fontFace ?? "Arial",
    fontSize: style.fontSize ?? 18,
    bold: style.bold ?? false,
    italic: style.italic ?? false,
    color: style.color ?? COLORS.graphite,
    alignment: style.alignment,
    valign: style.valign,
    lineSpacing: style.lineSpacing,
  };
  return box;
}

function addCard(slide, x, y, w, h, fill = COLORS.white, line = COLORS.light) {
  return shape(slide, "roundRect", x, y, w, h, {
    fill,
    line: { style: "solid", fill: line, width: 1 },
    borderRadius: "rounded-2xl",
    shadow: "shadow-sm",
  });
}

function addTitle(slide, label, title, subtitle, dark = false) {
  const fg = dark ? COLORS.white : COLORS.navy;
  const sub = dark ? "#D5DEE7" : COLORS.muted;
  textbox(
    slide,
    M,
    28,
    280,
    26,
    label.toUpperCase(),
    { fontSize: 12, bold: true, color: COLORS.coral },
  );
  textbox(slide, M, 58, 960, 64, title, {
    fontSize: 38,
    bold: true,
    color: fg,
  });
  if (subtitle) {
    textbox(slide, M, 118, 980, 42, subtitle, {
      fontSize: 16,
      color: sub,
    });
  }
}

function setNotes(slide, lines) {
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
  slide.speakerNotes.setVisible(true);
}

function metricCard(slide, x, y, w, h, value, label, source) {
  addCard(slide, x, y, w, h, COLORS.white, "#E7E0D7");
  textbox(slide, x + 18, y + 16, w - 36, 56, value, {
    fontSize: 28,
    bold: true,
    color: COLORS.navy,
  });
  textbox(slide, x + 18, y + 60, w - 36, 52, label, {
    fontSize: 14,
    color: COLORS.graphite,
  });
  textbox(slide, x + 18, y + h - 22, w - 36, 14, source, {
    fontSize: 8.5,
    color: COLORS.muted,
  });
}

function bulletList(slide, x, y, w, items, opts = {}) {
  const size = opts.fontSize ?? 18;
  let cy = y;
  for (const item of items) {
    textbox(slide, x, cy, w, 32, `• ${item}`, {
      fontSize: size,
      color: opts.color ?? COLORS.graphite,
    });
    cy += opts.gap ?? 34;
  }
}

function footer(slide, text) {
  textbox(slide, M, 680, 980, 18, text, {
    fontSize: 8.5,
    color: COLORS.muted,
  });
}

function insertImage(slide, filePath, x, y, w, h, opts = {}) {
  const bytes = fs.readFile(filePath);
  return bytes.then(async (buf) =>
    slide.images.add({
      blob: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      contentType: path.extname(filePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg",
      alt: opts.alt ?? path.basename(filePath),
      fit: opts.fit ?? "cover",
      geometry: opts.geometry,
      borderRadius: opts.borderRadius,
      position: { left: x, top: y, width: w, height: h },
    }),
  );
}

async function buildMainDeck() {
  const pres = Presentation.create({ slideSize: { width: W, height: H } });

  // 1. Cover
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    shape(slide, "rect", 0, 0, W, H, { fill: COLORS.ivory });
    shape(slide, "ellipse", 980, -120, 360, 360, {
      fill: "#E9DFD1",
      line: { style: "solid", fill: "none", width: 0 },
    });
    shape(slide, "ellipse", -80, 520, 260, 260, {
      fill: "#F0E2D7",
      line: { style: "solid", fill: "none", width: 0 },
    });
    textbox(
      slide,
      72,
      64,
      320,
      24,
      "MENULY",
      { fontSize: 12, bold: true, color: COLORS.coral },
    );
    textbox(
      slide,
      72,
      118,
      610,
      120,
      "Tu carta debería abrir el apetito antes de que llegue el plato",
      { fontSize: 36, bold: true, color: COLORS.navy, fontFace: "Georgia" },
    );
    textbox(
      slide,
      72,
      252,
      540,
      72,
      "Menuly convierte tu menú en una experiencia visual, rápida y fácil de gestionar.",
      { fontSize: 18, color: COLORS.graphite },
    );
    await insertImage(slide, IMG_COVER, 720, 120, 430, 560, {
      alt: "Menuly mobile menu mockup",
      geometry: "roundRect",
      borderRadius: "rounded-3xl",
      fit: "cover",
    });
    addCard(slide, 72, 590, 300, 84, "#FFFFFF", "#E7E0D7");
    textbox(slide, 92, 606, 250, 22, "Escanea, mira y decide.", {
      fontSize: 16,
      bold: true,
      color: COLORS.navy,
    });
    textbox(slide, 92, 632, 250, 18, "Sin app. Desde el QR.", {
      fontSize: 12,
      color: COLORS.graphite,
    });
    addCard(slide, 402, 590, 260, 84, COLORS.navy, COLORS.navy);
    textbox(slide, 430, 606, 200, 22, "menuly.es", {
      fontSize: 17,
      bold: true,
      color: COLORS.white,
    });
    textbox(slide, 430, 632, 190, 18, "+34 643 663 194", {
      fontSize: 12,
      color: "#D7E0E8",
    });
    setNotes(slide, [
      "Abrir con la idea central: Menuly no es una carta más, es una carta que vende mejor visualmente.",
      "La portada marca el tono: premium, gastronómico, claro y muy comercial.",
      "No entrar aún en funciones; solo promesa y contexto.",
    ]);
  }

  // 2. Problem
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "El problema",
      "Una lista de nombres no siempre vende un plato",
      "El cliente entiende el menú, pero no siempre lo desea. La diferencia está en cómo lo ve.",
    );
    await insertImage(slide, IMG_COMPARE, 64, 160, 678, 470, {
      alt: "PDF menu versus Menuly comparison",
      geometry: "roundRect",
      borderRadius: "rounded-3xl",
    });
    addCard(slide, 778, 160, 438, 470, "#FFFDFB", "#E7E0D7");
    bulletList(slide, 806, 194, 380, [
      "No visualiza el plato.",
      "Los productos rentables pasan desapercibidos.",
      "Actualizar la carta cuesta tiempo y dinero.",
      "No se sabe qué genera interés.",
    ], { fontSize: 20, gap: 78, color: COLORS.navy });
    textbox(slide, 806, 520, 370, 58, "PDF y papel informan. Menuly persuade.", {
      fontSize: 18,
      bold: true,
      color: COLORS.coral,
      fontFace: "Georgia",
    });
    footer(slide, "Menuly • problema que resuelve");
    setNotes(slide, [
      "Subrayar que el dolor no es solo operativo, también comercial: un nombre no despierta apetito.",
      "La comparación PDF vs Menuly debe ser la primera prueba visual.",
    ]);
  }

  // 3. Opportunity
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "La oportunidad local",
      "La restauración española ya es un mercado enorme y visual",
      "Las cifras justifican una solución enfocada al sector. No es un nicho pequeño.",
    );
    await insertImage(slide, IMG_SPAIN, 58, 170, 430, 430, {
      alt: "Spain silhouette",
      geometry: "roundRect",
      borderRadius: "rounded-3xl",
    });
    metricCard(slide, 530, 172, 310, 158, "≈263.500", "establecimientos de restauración", "Fuente: Hostelería de España");
    metricCard(slide, 860, 172, 310, 158, "≈81.000", "restaurantes", "Fuente: Hostelería de España");
    metricCard(slide, 530, 350, 310, 158, "116.200 M€", "facturación del sector", "Fuente: Hostelería de España");
    metricCard(slide, 860, 350, 310, 158, "35.872 M€", "gasto fuera del hogar en 2024", "Fuente: MAPA, Informe 2024");
    textbox(slide, 530, 546, 640, 34, "El restaurante compite por atención. Menuly la convierte en decisión.", {
      fontSize: 20,
      bold: true,
      color: COLORS.navy,
      fontFace: "Georgia",
    });
    footer(slide, "Datos sectoriales usados en la diapositiva 3 y la página de fuentes.");
    setNotes(slide, [
      "La idea es dimensionar el mercado sin abrumar: España es enorme para un producto visual de restauración.",
      "Mostrar solo cuatro cifras grandes y dejar la fuente en pequeño.",
      "No añadir más datos aquí; el objetivo es oportunidad, no enciclopedia.",
    ]);
  }

  // 4. What is Menuly
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Qué es Menuly",
      "Una carta que se ve, se entiende y se recuerda",
      "Sin descargar apps y desde cualquier dispositivo.",
    );
    const x0 = 92;
    const y = 290;
    const stepW = 150;
    const gap = 34;
    const labels = ["QR", "Carta visual", "Descubrimiento", "Información", "Carrito"];
    labels.forEach((lab, i) => {
      addCard(slide, x0 + i * (stepW + gap), y, stepW, 122, "#FFFFFF", "#E7E0D7");
      textbox(slide, x0 + i * (stepW + gap) + 18, y + 24, stepW - 36, 30, lab, {
        fontSize: 16,
        bold: true,
        color: i === 0 ? COLORS.coral : COLORS.navy,
      });
      textbox(slide, x0 + i * (stepW + gap) + 18, y + 58, stepW - 36, 36, i === 0 ? "Escanea y abre." : "", {
        fontSize: 12,
        color: COLORS.graphite,
      });
      if (i < labels.length - 1) {
        textbox(slide, x0 + i * (stepW + gap) + stepW + 6, y + 46, 30, 24, "→", {
          fontSize: 22,
          bold: true,
          color: COLORS.coral,
        });
      }
    });
    addCard(slide, 170, 462, 940, 118, COLORS.navy, COLORS.navy);
    textbox(slide, 196, 496, 890, 40, "El cliente mira el plato, revisa el precio, entiende los alérgenos y organiza su elección.", {
      fontSize: 22,
      bold: true,
      color: COLORS.white,
      fontFace: "Georgia",
    });
    textbox(slide, 196, 544, 700, 18, "Todo queda en un recorrido simple y visual.", {
      fontSize: 12,
      color: "#D6E0E9",
    });
    setNotes(slide, [
      "Explicar que la secuencia es importante: QR, exploración visual, ficha clara, carrito orientativo.",
      "Remarcar que no es una app que haya que instalar.",
    ]);
  }

  // 5. Experience
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Experiencia del comensal",
      "Todo lo necesario para decidir mejor",
      "La carta combina estímulo visual y claridad práctica.",
    );
    await insertImage(slide, IMG_COVER, 60, 168, 370, 488, {
      alt: "Menuly mobile view",
      geometry: "roundRect",
      borderRadius: "rounded-3xl",
    });
    const chips = [
      ["Vídeo", 478, 214],
      ["Categorías", 660, 178],
      ["Precio", 850, 214],
      ["Alérgenos", 1040, 290],
      ["Idiomas", 1020, 410],
      ["Carrito", 840, 530],
      ["Observaciones", 620, 570],
      ["Logo", 474, 430],
    ];
    for (const [label, x, y] of chips) {
      addCard(slide, x, y, 150, 48, "#FFFFFF", "#E7E0D7");
      textbox(slide, x + 12, y + 13, 126, 18, label, {
        fontSize: 13,
        bold: true,
        color: COLORS.navy,
      });
    }
    textbox(slide, 500, 110, 460, 32, "La carta acompaña la decisión, no la interrumpe.", {
      fontSize: 24,
      bold: true,
      color: COLORS.coral,
      fontFace: "Georgia",
    });
    setNotes(slide, [
      "Acompañar el recorrido con el móvil grande a la izquierda y los elementos clave alrededor.",
      "Poco texto, mucho señalamiento visual.",
    ]);
  }

  // 6. Two ways to browse
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Dos formas de explorar",
      "Impacto visual cuando apetece. Rapidez cuando se necesita.",
      "El cliente elige cómo consultar la carta sin perder contexto.",
    );
    addCard(slide, 60, 170, 526, 458, "#FFFFFF", "#E7E0D7");
    addCard(slide, 694, 170, 526, 458, "#FFFFFF", "#E7E0D7");
    textbox(slide, 90, 194, 220, 26, "Vista vertical", {
      fontSize: 22,
      bold: true,
      color: COLORS.navy,
      fontFace: "Georgia",
    });
    textbox(slide, 724, 194, 220, 26, "Vista listada", {
      fontSize: 22,
      bold: true,
      color: COLORS.navy,
      fontFace: "Georgia",
    });
    shape(slide, "roundRect", 106, 246, 414, 336, {
      fill: COLORS.darkPanel,
      line: { style: "solid", fill: COLORS.darkPanel, width: 1 },
      borderRadius: "rounded-3xl",
    });
    shape(slide, "roundRect", 740, 246, 414, 336, {
      fill: COLORS.panel,
      line: { style: "solid", fill: "#E7E0D7", width: 1 },
      borderRadius: "rounded-3xl",
    });
    textbox(slide, 136, 320, 220, 24, "Feed de producto", {
      fontSize: 24,
      bold: true,
      color: COLORS.white,
    });
    textbox(slide, 772, 320, 240, 24, "Categorías + miniaturas", {
      fontSize: 24,
      bold: true,
      color: COLORS.navy,
    });
    textbox(slide, 136, 364, 320, 70, "Vídeo vertical, producto protagonista y navegación rápida.", {
      fontSize: 16,
      color: "#D5DEE7",
    });
    textbox(slide, 772, 364, 320, 70, "Una lectura ágil para el cliente que va al grano.", {
      fontSize: 16,
      color: COLORS.graphite,
    });
    setNotes(slide, [
      "La diferencia no es tecnológica, es de contexto: cuando el usuario quiere inspiración, ve vídeo; cuando quiere rapidez, lista.",
      "Mostrar dos modos en paralelo.",
    ]);
  }

  // 7. Easy management
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Gestión sencilla",
      "Si sabes usar tu móvil, sabes gestionar Menuly",
      "Un flujo corto para que el restaurante pueda editar sin fricción.",
    );
    const steps = [
      "Crea categorías.",
      "Añade productos.",
      "Sube vídeo o fotografía.",
      "Publica y comparte el QR.",
    ];
    steps.forEach((s, i) => {
      addCard(slide, 90 + i * 280, 210, 220, 160, "#FFFFFF", "#E7E0D7");
      shape(slide, "ellipse", 120 + i * 280, 234, 42, 42, {
        fill: COLORS.coral,
        line: { style: "solid", fill: COLORS.coral, width: 1 },
      });
      textbox(slide, 132 + i * 280, 246, 18, 16, `${i + 1}`, {
        fontSize: 15,
        bold: true,
        color: COLORS.white,
        alignment: "center",
      });
      textbox(slide, 110 + i * 280, 288, 178, 60, s, {
        fontSize: 18,
        bold: true,
        color: COLORS.navy,
        fontFace: "Georgia",
      });
    });
    addCard(slide, 90, 412, 1100, 142, COLORS.navy, COLORS.navy);
    textbox(slide, 124, 442, 1000, 34, "Editar precio, disponibilidad, descripciones y alérgenos en minutos.", {
      fontSize: 24,
      bold: true,
      color: COLORS.white,
    });
    textbox(slide, 124, 488, 980, 18, "Y mantener el QR siempre apuntando a la versión correcta.", {
      fontSize: 14,
      color: "#D5DEE7",
    });
    setNotes(slide, [
      "El mensaje aquí es simple: la operación no exige formación técnica.",
      "Hacer visible el flujo en 4 pasos y cerrar con la idea de edición rápida.",
    ]);
  }

  // 8. Languages
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Idiomas y accesibilidad",
      "Tu carta también atiende al cliente extranjero",
      "La traducción ayuda a entender. El restaurante decide cómo y cuándo mostrarla.",
    );
    addCard(slide, 74, 180, 500, 420, "#FFFFFF", "#E7E0D7");
    textbox(slide, 104, 212, 240, 28, "Selector de idioma", {
      fontSize: 24,
      bold: true,
      color: COLORS.navy,
      fontFace: "Georgia",
    });
    bulletList(slide, 104, 266, 380, [
      "Traducción automática del contenido.",
      "Selector de idiomas opcional.",
      "El restaurante puede revisar el texto.",
      "Alérgenos y descripciones quedan claros.",
    ], { fontSize: 18, gap: 54 });
    addCard(slide, 638, 178, 578, 422, COLORS.navy, COLORS.navy);
    textbox(slide, 684, 226, 450, 58, "Una carta en el idioma correcto abre más conversación.", {
      fontSize: 28,
      bold: true,
      color: COLORS.white,
      fontFace: "Georgia",
    });
    textbox(slide, 684, 314, 452, 86, "No prometemos traducción perfecta. Prometemos una base útil, revisable y fácil de activar.", {
      fontSize: 18,
      color: "#D7E0E8",
    });
    setNotes(slide, [
      "Aclarar la política con honestidad: traducción automática con revisión opcional.",
      "No exagerar. El beneficio es claridad para visitante y control para el restaurante.",
    ]);
  }

  // 9. Analytics
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Analíticas que sirven para vender",
      "No solo sabes qué compran. Sabes qué despierta interés.",
      "Las métricas ayudan a decidir qué destacar y qué mejorar.",
    );
    addCard(slide, 72, 210, 1136, 240, "#FFFFFF", "#E7E0D7");
    const funnel = [
      ["Visitas", 160],
      ["Reproducciones", 250],
      ["Vistas", 190],
      ["Añadidos al carrito", 120],
    ];
    funnel.forEach((f, i) => {
      const x = 138 + i * 250;
      shape(slide, "roundRect", x, 286, 170, f[1], {
        fill: i % 2 === 0 ? COLORS.navy : COLORS.coral,
        line: { style: "solid", fill: i % 2 === 0 ? COLORS.navy : COLORS.coral, width: 1 },
        borderRadius: "rounded-3xl",
      });
      textbox(slide, x + 20, 256, 130, 24, f[0], {
        fontSize: 16,
        bold: true,
        color: COLORS.navy,
      });
      textbox(slide, x + 28, 314, 118, 24, "→", {
        fontSize: 24,
        bold: true,
        color: i % 2 === 0 ? COLORS.white : COLORS.white,
        alignment: "center",
      });
    });
    const qx = 104;
    const questions = [
      "¿Qué platos atraen más miradas?",
      "¿Cuáles se añaden más al carrito?",
      "¿Qué productos necesitan mejor presentación?",
      "¿Qué objetivo trabajamos esta semana?",
    ];
    questions.forEach((q, i) => {
      addCard(slide, qx + (i % 2) * 560, 486 + Math.floor(i / 2) * 86, 520, 64, "#FBFBFA", "#E7E0D7");
      textbox(slide, qx + 22 + (i % 2) * 560, 506 + Math.floor(i / 2) * 86, 480, 20, q, {
        fontSize: 16,
        color: COLORS.graphite,
      });
    });
    footer(slide, "Métricas orientadas a decisiones. Sin datos inventados.");
    setNotes(slide, [
      "No prometer aumento de ventas. Solo enseñar qué preguntas responde la analítica.",
      "El embudo debe ser simple y la lista de preguntas muy práctica.",
    ]);
  }

  // 10. Upsell
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Venta adicional",
      "Da protagonismo a lo que quieres vender",
      "Menuly ayuda a destacar platos, bebidas y postres con más intención.",
    );
    const items = [
      ["Entrante recomendado", "Presentación breve y visual."],
      ["Bebida sugerida", "Acompaña la recomendación."],
      ["Postre complementario", "Cierra la experiencia."],
      ["Producto con mayor margen", "Más visibilidad, más atención."],
    ];
    items.forEach((it, i) => {
      addCard(slide, 76 + i * 282, 230, 248, 232, "#FFFFFF", "#E7E0D7");
      shape(slide, "ellipse", 100 + i * 282, 258, 44, 44, {
        fill: COLORS.coral,
        line: { style: "solid", fill: COLORS.coral, width: 1 },
      });
      textbox(slide, 112 + i * 282, 271, 20, 16, String(i + 1), {
        fontSize: 15,
        bold: true,
        color: COLORS.white,
        alignment: "center",
      });
      textbox(slide, 100 + i * 282, 326, 196, 60, it[0], {
        fontSize: 18,
        bold: true,
        color: COLORS.navy,
        fontFace: "Georgia",
      });
      textbox(slide, 100 + i * 282, 396, 196, 42, it[1], {
        fontSize: 13,
        color: COLORS.graphite,
      });
    });
    textbox(slide, 96, 500, 1080, 40, "No garantizamos resultados. Sí damos más espacio a la decisión correcta.", {
      fontSize: 20,
      bold: true,
      color: COLORS.navy,
    });
    setNotes(slide, [
      "Enfatizar que Menuly no inventa ventas. Ayuda a dar protagonismo a lo rentable.",
      "Mantener el lenguaje prudente: sugerir, no prometer.",
    ]);
  }

  // 11. Customization
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Personalización",
      "Tu restaurante, tu estilo",
      "Siete plantillas y una identidad consistente para cada local.",
    );
    await insertImage(slide, IMG_BOARD, 74, 176, 740, 478, {
      alt: "Menuly brand system board",
      geometry: "roundRect",
      borderRadius: "rounded-3xl",
    });
    addCard(slide, 846, 176, 364, 478, "#FFFFFF", "#E7E0D7");
    bulletList(slide, 878, 212, 290, [
      "Dos plantillas gratuitas.",
      "Cinco plantillas premium.",
      "Logo y URL personalizada.",
      "Código QR propio.",
      "Estilo gastronómico premium.",
    ], { fontSize: 18, gap: 62 });
    setNotes(slide, [
      "La visualización aquí apoya la parte de marca y deja claro que Menuly no es una plantilla única.",
      "Mencionar siete plantillas sin inventar nombres.",
    ]);
  }

  // 12. Pricing
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Precios",
      "Un plan para cada momento",
      "Tres opciones claras, con el plan Carta como referencia principal.",
    );
    const cards = [
      ["Prueba", "0 €", "7 días\n1 restaurante\n5 categorías\n1 producto por categoría"],
      ["Carta", "34,99 €/mes", "Hasta 100 productos\nCategorías ilimitadas\n7 plantillas\nAnalíticas\nSoporte"],
      ["Llave en mano", "149,99 €/mes", "Primer mes gratis\nGrabación y edición de vídeos\nHasta 4 vídeos por categoría\nConfiguración completa"],
    ];
    cards.forEach((c, i) => {
      const x = 74 + i * 388;
      const fill = i === 1 ? COLORS.navy : "#FFFFFF";
      const line = i === 1 ? COLORS.navy : "#E7E0D7";
      addCard(slide, x, 190, 352, 430, fill, line);
      textbox(slide, x + 28, 220, 260, 26, c[0], {
        fontSize: 24,
        bold: true,
        color: i === 1 ? COLORS.white : COLORS.navy,
        fontFace: "Georgia",
      });
      textbox(slide, x + 28, 264, 260, 54, c[1], {
        fontSize: 28,
        bold: true,
        color: i === 1 ? COLORS.coral : COLORS.coral,
      });
      textbox(slide, x + 28, 330, 286, 146, c[2], {
        fontSize: 16,
        color: i === 1 ? "#D7E0E8" : COLORS.graphite,
        lineSpacing: 1.25,
      });
      if (i === 1) {
        shape(slide, "roundRect", x + 28, 510, 186, 34, {
          fill: COLORS.coral,
          line: { style: "solid", fill: COLORS.coral, width: 1 },
          borderRadius: "rounded-full",
        });
        textbox(slide, x + 48, 517, 144, 16, "Recomendado", {
          fontSize: 12,
          bold: true,
          color: COLORS.white,
        });
      }
    });
    textbox(slide, 74, 646, 980, 18, "Plan anual Carta: 344,30 € en un único pago. Ahorro aproximado del 18 % frente al pago mensual.", {
      fontSize: 13,
      color: COLORS.graphite,
    });
    setNotes(slide, [
      "Los precios deben mostrarse exactamente como el texto del briefing.",
      "Reforzar la opción Carta como el punto de equilibrio entre sencillez y valor.",
    ]);
  }

  // 13. Start
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(
      slide,
      "Empezar",
      "Tu nueva carta puede empezar hoy",
      "La activación es breve y orientada a que el restaurante vea valor pronto.",
    );
    addCard(slide, 74, 188, 598, 398, "#FFFFFF", "#E7E0D7");
    const startSteps = [
      "Crear la cuenta.",
      "Configurar el restaurante.",
      "Añadir los primeros productos.",
      "Descargar el QR.",
      "Compartir la carta.",
    ];
    startSteps.forEach((s, i) => {
      textbox(slide, 106, 226 + i * 58, 500, 26, `${i + 1}. ${s}`, {
        fontSize: 20,
        bold: true,
        color: COLORS.navy,
      });
    });
    addCard(slide, 708, 188, 490, 398, COLORS.navy, COLORS.navy);
    textbox(slide, 740, 244, 420, 56, "Prueba Menuly gratis durante 7 días", {
      fontSize: 30,
      bold: true,
      color: COLORS.white,
      fontFace: "Georgia",
    });
    textbox(slide, 740, 328, 402, 52, "menuly.es", {
      fontSize: 22,
      bold: true,
      color: COLORS.coral,
    });
    textbox(slide, 740, 388, 390, 44, "Soporte y acompañamiento desde el principio.", {
      fontSize: 16,
      color: "#D7E0E8",
    });
    setNotes(slide, [
      "Cerrar con una llamada muy clara a prueba gratuita y puesta en marcha simple.",
      "La URL y el soporte deben quedar muy visibles.",
    ]);
  }

  // 14. Close
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    shape(slide, "rect", 0, 0, W, H, { fill: COLORS.ivory });
    addCard(slide, 72, 84, 1136, 552, COLORS.navy, COLORS.navy);
    textbox(slide, 122, 142, 680, 72, "Haz que tus clientes elijan con los ojos", {
      fontSize: 34,
      bold: true,
      color: COLORS.white,
      fontFace: "Georgia",
    });
    textbox(slide, 122, 224, 580, 40, "Convierte cada plato en una oportunidad de venta.", {
      fontSize: 22,
      color: "#D7E0E8",
    });
    textbox(slide, 122, 312, 240, 24, "menuly.es", {
      fontSize: 24,
      bold: true,
      color: COLORS.coral,
    });
    textbox(slide, 122, 352, 330, 24, "+34 643 663 194", {
      fontSize: 20,
      color: COLORS.white,
    });
    shape(slide, "roundRect", 122, 432, 220, 48, {
      fill: COLORS.coral,
      line: { style: "solid", fill: COLORS.coral, width: 1 },
      borderRadius: "rounded-full",
    });
    textbox(slide, 152, 445, 160, 16, "Creamos juntos tu primera carta", {
      fontSize: 13,
      bold: true,
      color: COLORS.white,
    });
    await insertImage(slide, IMG_COVER, 844, 146, 260, 420, {
      alt: "Menuly mobile final mockup",
      geometry: "roundRect",
      borderRadius: "rounded-3xl",
    });
    setNotes(slide, [
      "Cerrar con la emoción correcta: imagen, CTA y contacto.",
      "Recordar que el objetivo final es que el restaurante pruebe y contrate.",
    ]);
  }

  const pptxPath = path.join(OUT_DIR, "menuly-commercial-pitch.pptx");
  const pptx = await PresentationFile.exportPptx(pres);
  await pptx.save(pptxPath);
  return pptxPath;
}

async function buildSummaryDeck() {
  const pres = Presentation.create({ slideSize: { width: W, height: H } });

  // 1. Cover summary
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    textbox(slide, 72, 60, 280, 24, "MENULY", {
      fontSize: 12,
      bold: true,
      color: COLORS.coral,
    });
    textbox(slide, 72, 118, 680, 104, "Carta visual que despierta el apetito", {
      fontSize: 42,
      bold: true,
      color: COLORS.navy,
      fontFace: "Georgia",
    });
    textbox(slide, 72, 236, 520, 48, "Versión resumida para reuniones rápidas con restaurantes.", {
      fontSize: 18,
      color: COLORS.graphite,
    });
    addCard(slide, 720, 126, 456, 466, "#FFFFFF", "#E7E0D7");
    textbox(slide, 750, 160, 220, 28, "Menuly", {
      fontSize: 26,
      bold: true,
      color: COLORS.navy,
      fontFace: "Georgia",
    });
    textbox(slide, 750, 210, 300, 30, "QR → carta visual → decisión", {
      fontSize: 18,
      bold: true,
      color: COLORS.coral,
    });
    textbox(slide, 750, 278, 360, 120, "Una solución rápida para enseñar platos, alérgenos, idiomas y carrito desde móvil.", {
      fontSize: 18,
      color: COLORS.graphite,
      lineSpacing: 1.25,
    });
    shape(slide, "roundRect", 750, 420, 180, 48, {
      fill: COLORS.navy,
      line: { style: "solid", fill: COLORS.navy, width: 1 },
      borderRadius: "rounded-full",
    });
    textbox(slide, 776, 433, 128, 16, "Ver carta completa", {
      fontSize: 13,
      bold: true,
      color: COLORS.white,
    });
    setNotes(slide, [
      "Esta versión compacta abre con la promesa y una arquitectura simple del producto.",
    ]);
  }

  // 2. Problem + opportunity
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(slide, "Problema y mercado", "La restauración española necesita una carta más visual", "Cuatro ideas: dolor real, mercado grande y oportunidad clara.");
    addCard(slide, 66, 170, 540, 450, "#FFFFFF", "#E7E0D7");
    addCard(slide, 674, 170, 540, 450, "#FFFFFF", "#E7E0D7");
    bulletList(slide, 98, 208, 460, [
      "El cliente no visualiza el plato.",
      "Los productos importantes pasan desapercibidos.",
      "Actualizar una carta cuesta tiempo y dinero.",
      "No se sabe qué genera interés.",
    ], { fontSize: 18, gap: 66 });
    textbox(slide, 98, 474, 450, 50, "≈263.500 establecimientos, ≈81.000 restaurantes y 116.200 M€ de facturación.", {
      fontSize: 19,
      bold: true,
      color: COLORS.navy,
      fontFace: "Georgia",
    });
    textbox(slide, 704, 210, 460, 44, "Menuly encaja en un sector enorme y muy visual.", {
      fontSize: 24,
      bold: true,
      color: COLORS.navy,
      fontFace: "Georgia",
    });
    bulletList(slide, 704, 272, 420, [
      "Menú por QR sin app.",
      "Fotos y vídeos verticales.",
      "Gestión desde el móvil.",
      "Analíticas sencillas.",
    ], { fontSize: 18, gap: 58 });
    setNotes(slide, [
      "En la versión resumida, el objetivo es dar contexto y mover rápido hacia el valor.",
    ]);
  }

  // 3. How it works
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(slide, "Cómo funciona", "Tres pasos para entender Menuly", "Un flujo de adopción corto y fácil de explicar.");
    const xs = [82, 350, 618, 886];
    const ss = ["Escanea", "Explora", "Elige", "Comparte"];
    ss.forEach((s, i) => {
      addCard(slide, xs[i], 248, 186, 180, "#FFFFFF", "#E7E0D7");
      shape(slide, "ellipse", xs[i] + 62, 272, 62, 62, {
        fill: i % 2 ? COLORS.coral : COLORS.navy,
        line: { style: "solid", fill: i % 2 ? COLORS.coral : COLORS.navy, width: 1 },
      });
      textbox(slide, xs[i] + 16, 356, 154, 24, s, {
        fontSize: 20,
        bold: true,
        color: COLORS.navy,
        alignment: "center",
      });
      if (i < 3) textbox(slide, xs[i] + 192, 316, 26, 26, "→", { fontSize: 26, bold: true, color: COLORS.coral });
    });
    setNotes(slide, ["Usar esta diapositiva para explicar el producto en menos de un minuto."]);
  }

  // 4. Features + pricing
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(slide, "Funcionalidades y precio", "Lo que incluye y cuánto cuesta", "Agrupado en bloques, no en lista interminable.");
    addCard(slide, 64, 178, 560, 420, "#FFFFFF", "#E7E0D7");
    addCard(slide, 656, 178, 560, 420, COLORS.navy, COLORS.navy);
    textbox(slide, 92, 214, 240, 24, "Incluye", { fontSize: 24, bold: true, color: COLORS.navy, fontFace: "Georgia" });
    bulletList(slide, 92, 266, 480, [
      "Feed visual y vista listada.",
      "Idiomas y alérgenos.",
      "Panel mobile-first.",
      "Analíticas y objetivos.",
      "7 plantillas.",
    ], { fontSize: 17, gap: 54 });
    textbox(slide, 690, 220, 220, 28, "Plan Carta", { fontSize: 28, bold: true, color: COLORS.white, fontFace: "Georgia" });
    textbox(slide, 690, 268, 220, 42, "34,99 €/mes", { fontSize: 34, bold: true, color: COLORS.coral });
    textbox(slide, 690, 334, 420, 92, "Hasta 100 productos. Categorías ilimitadas. Analíticas, QR, carrito y soporte.", { fontSize: 18, color: "#D7E0E8" });
    shape(slide, "roundRect", 690, 474, 170, 42, { fill: COLORS.coral, line: { style: "solid", fill: COLORS.coral, width: 1 }, borderRadius: "rounded-full" });
    textbox(slide, 718, 486, 112, 16, "Recomendado", { fontSize: 13, bold: true, color: COLORS.white });
    setNotes(slide, ["Dejar claro que el precio se explica sin tecnicismos y sin promesas exageradas."]);
  }

  // 5. CTA
  {
    const slide = pres.slides.add();
    slide.background.fill = COLORS.ivory;
    addTitle(slide, "Cierre", "Prueba Menuly durante 7 días", "Una carta nueva puede empezar hoy.");
    addCard(slide, 100, 210, 1080, 300, COLORS.navy, COLORS.navy);
    textbox(slide, 132, 254, 700, 60, "Haz que tus clientes elijan con los ojos", { fontSize: 32, bold: true, color: COLORS.white, fontFace: "Georgia" });
    textbox(slide, 132, 334, 620, 34, "menuly.es • +34 643 663 194", { fontSize: 20, color: COLORS.coral });
    shape(slide, "roundRect", 132, 404, 290, 52, { fill: COLORS.coral, line: { style: "solid", fill: COLORS.coral, width: 1 }, borderRadius: "rounded-full" });
    textbox(slide, 156, 418, 244, 16, "Creamos juntos tu primera carta", { fontSize: 12, bold: true, color: COLORS.white });
    setNotes(slide, ["Rematar con la acción: probar, configurar y publicar el QR."]);
  }

  const pptxPath = path.join(OUT_DIR, "menuly-commercial-summary.pptx");
  const pptx = await PresentationFile.exportPptx(pres);
  await pptx.save(pptxPath);
  return pptxPath;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const mainPath = await buildMainDeck();
  const summaryPath = await buildSummaryDeck();
  console.log(JSON.stringify({ mainPath, summaryPath }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
