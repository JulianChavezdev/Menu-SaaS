from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "manual-carta-video-restaurantes.pdf"
OUTPUT = ROOT / "output" / "pdf" / "manual-menuly-restaurantes.pdf"
PUBLIC = ROOT / "public" / "manual-menuly-restaurantes.pdf"


def rgb(value: int) -> tuple[float, float, float]:
    return ((value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255)


def background(page: fitz.Page, rect: fitz.Rect) -> tuple[float, float, float]:
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    x = max(0, min(pix.width - 1, round(((rect.x0 + rect.x1) / 2) * 2)))
    y = max(0, min(pix.height - 1, round((rect.y0 - 3) * 2)))
    sample = pix.pixel(x, y)
    return tuple(channel / 255 for channel in sample[:3])


def style(page: fitz.Page, rect: fitz.Rect) -> tuple[float, tuple[float, float, float]]:
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                span_rect = fitz.Rect(span["bbox"])
                if span_rect.intersects(rect):
                    return span["size"], rgb(span["color"])
    return 9, (0.05, 0.06, 0.12)


def replace(page: fitz.Page, source: str, target: str) -> None:
    matches = page.search_for(source)
    replacements = []
    for rect in matches:
        font_size, color = style(page, rect)
        fill = background(page, rect)
        area = fitz.Rect(rect.x0 - 1, rect.y0 - 1, rect.x1 + 8, rect.y1 + 1)
        page.add_redact_annot(area, fill=fill)
        replacements.append((rect, font_size, color, target))
    if not replacements:
        return
    page.apply_redactions()
    for rect, font_size, color, target in replacements:
        page.insert_text(
            fitz.Point(rect.x0, rect.y1 - 1),
            target,
            fontname="helv",
            fontsize=font_size,
            color=color,
        )


def main() -> None:
    document = fitz.open(SOURCE)
    for page in document:
        replace(page, "CARTA VIDEO", "Menuly")
        replace(page, "cartavideo.es", "menuly.es")
    metadata = document.metadata
    metadata.update({"title": "Menuly - Manual del restaurante", "author": "Menuly", "subject": "Guía para gestionar una carta digital Menuly"})
    document.set_metadata(metadata)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document.save(OUTPUT, garbage=4, deflate=True)
    document.close()
    PUBLIC.write_bytes(OUTPUT.read_bytes())


if __name__ == "__main__":
    main()
