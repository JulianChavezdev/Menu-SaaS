from pathlib import Path
from textwrap import wrap

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "manual-menuly-restaurantes.pdf"
PUBLIC = ROOT / "public" / "manual-menuly-restaurantes.pdf"
WIDTH, HEIGHT = A4

INK = HexColor("#172033")
MUTED = HexColor("#667085")
PAPER = HexColor("#F8F5EF")
WHITE = HexColor("#FFFFFF")
ORANGE = HexColor("#E85D26")
ORANGE_LIGHT = HexColor("#FCE7DA")
GREEN = HexColor("#237A57")
GREEN_LIGHT = HexColor("#DFF2E8")
YELLOW = HexColor("#F5C451")
YELLOW_LIGHT = HexColor("#FFF3CE")
RED = HexColor("#C4443D")
RED_LIGHT = HexColor("#FBE5E3")
LINE = HexColor("#DED8CE")
NAVY = HexColor("#101426")


def register_fonts() -> None:
    regular = Path("C:/Windows/Fonts/arial.ttf")
    bold = Path("C:/Windows/Fonts/arialbd.ttf")
    pdfmetrics.registerFont(TTFont("MenulySans", str(regular)))
    pdfmetrics.registerFont(TTFont("MenulySansBold", str(bold)))


def rounded(c: canvas.Canvas, x: float, y: float, w: float, h: float, fill, radius=12, stroke=None, width=1) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.setLineWidth(width)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)


def text(c: canvas.Canvas, value: str, x: float, y: float, size=10, color=INK, bold=False) -> None:
    c.setFillColor(color)
    c.setFont("MenulySansBold" if bold else "MenulySans", size)
    c.drawString(x, y, value)


def centered(c: canvas.Canvas, value: str, x: float, y: float, size=10, color=INK, bold=False) -> None:
    c.setFillColor(color)
    c.setFont("MenulySansBold" if bold else "MenulySans", size)
    c.drawCentredString(x, y, value)


def lines(c: canvas.Canvas, value: str, x: float, y: float, width_chars: int, size=9, leading=12, color=MUTED, bold=False, max_lines=5) -> float:
    rows = wrap(value, width=max(10, width_chars), break_long_words=False)[:max_lines]
    for row in rows:
        text(c, row, x, y, size=size, color=color, bold=bold)
        y -= leading
    return y


def icon(c: canvas.Canvas, name: str, x: float, y: float, size=30, color=ORANGE, bg=ORANGE_LIGHT) -> None:
    rounded(c, x, y, size, size, bg, radius=8)
    cx, cy = x + size / 2, y + size / 2
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(2)
    if name == "user":
        c.circle(cx, cy + 5, 4, fill=0, stroke=1)
        c.arc(cx - 8, cy - 10, cx + 8, cy + 3, 0, 180)
    elif name == "eye":
        c.ellipse(cx - 10, cy - 5, cx + 10, cy + 5, fill=0, stroke=1)
        c.circle(cx, cy, 3, fill=1, stroke=0)
    elif name == "home":
        c.line(cx - 9, cy, cx, cy + 8); c.line(cx, cy + 8, cx + 9, cy)
        c.rect(cx - 7, cy - 8, 14, 9, fill=0, stroke=1)
    elif name == "store":
        c.rect(cx - 9, cy - 7, 18, 12, fill=0, stroke=1)
        c.line(cx - 11, cy + 5, cx + 11, cy + 5); c.line(cx - 7, cy + 10, cx + 7, cy + 10)
    elif name == "list":
        for offset in (7, 0, -7):
            c.circle(cx - 8, cy + offset, 1.5, fill=1, stroke=0); c.line(cx - 3, cy + offset, cx + 9, cy + offset)
    elif name == "dish":
        c.circle(cx, cy, 9, fill=0, stroke=1); c.circle(cx, cy, 4, fill=0, stroke=1)
    elif name == "media":
        c.rect(cx - 9, cy - 8, 18, 16, fill=0, stroke=1)
        c.line(cx - 7, cy - 5, cx - 1, cy + 1); c.line(cx - 1, cy + 1, cx + 7, cy - 6)
        c.circle(cx + 4, cy + 4, 2, fill=0, stroke=1)
    elif name == "play":
        c.circle(cx, cy, 10, fill=0, stroke=1)
        p = c.beginPath(); p.moveTo(cx - 3, cy - 6); p.lineTo(cx + 6, cy); p.lineTo(cx - 3, cy + 6); p.close(); c.drawPath(p, fill=1, stroke=0)
    elif name == "alert":
        p = c.beginPath(); p.moveTo(cx, cy + 10); p.lineTo(cx + 10, cy - 8); p.lineTo(cx - 10, cy - 8); p.close(); c.drawPath(p, fill=0, stroke=1)
        c.line(cx, cy + 4, cx, cy - 2); c.circle(cx, cy - 5, 1.2, fill=1, stroke=0)
    elif name == "link":
        c.ellipse(cx - 10, cy - 4, cx + 2, cy + 5, fill=0, stroke=1); c.ellipse(cx - 2, cy - 5, cx + 10, cy + 4, fill=0, stroke=1); c.line(cx - 4, cy, cx + 4, cy)
    elif name == "palette":
        c.circle(cx, cy, 10, fill=0, stroke=1)
        for dx, dy in ((-4,4),(3,5),(-5,-2),(3,-3)): c.circle(cx+dx,cy+dy,1.5,fill=1,stroke=0)
    elif name == "language":
        centered(c, "ES", cx, cy - 3, size=8, color=color, bold=True)
    elif name == "publish":
        c.line(cx, cy - 9, cx, cy + 6); c.line(cx, cy + 6, cx - 5, cy + 1); c.line(cx, cy + 6, cx + 5, cy + 1)
        c.line(cx - 9, cy - 3, cx - 9, cy - 9); c.line(cx - 9, cy - 9, cx + 9, cy - 9); c.line(cx + 9, cy - 9, cx + 9, cy - 3)
    elif name == "cart":
        c.line(cx - 10, cy + 7, cx - 7, cy + 7); c.line(cx - 7, cy + 7, cx - 4, cy - 5); c.line(cx - 4, cy - 5, cx + 8, cy - 5); c.line(cx + 8, cy - 5, cx + 10, cy + 3); c.line(cx - 5, cy + 3, cx + 10, cy + 3)
        c.circle(cx - 2, cy - 9, 1.5, fill=1, stroke=0); c.circle(cx + 7, cy - 9, 1.5, fill=1, stroke=0)
    elif name == "qr":
        for dx, dy in ((-8,2),(2,2),(-8,-8)):
            c.rect(cx+dx,cy+dy,7,7,fill=0,stroke=1); c.rect(cx+dx+2,cy+dy+2,3,3,fill=1,stroke=0)
        c.rect(cx+3,cy-7,3,3,fill=1,stroke=0); c.rect(cx+8,cy-3,2,7,fill=1,stroke=0)
    elif name == "chart":
        c.line(cx - 9, cy - 8, cx - 9, cy + 8); c.line(cx - 9, cy - 8, cx + 10, cy - 8)
        c.line(cx - 6, cy - 2, cx - 1, cy + 3); c.line(cx - 1, cy + 3, cx + 3, cy); c.line(cx + 3, cy, cx + 9, cy + 8)
    elif name == "team":
        c.circle(cx - 5, cy + 4, 3, fill=0, stroke=1); c.circle(cx + 5, cy + 4, 3, fill=0, stroke=1)
        c.arc(cx - 12, cy - 8, cx + 2, cy + 2, 0, 180); c.arc(cx - 2, cy - 8, cx + 12, cy + 2, 0, 180)
    elif name == "card":
        c.rect(cx - 10, cy - 7, 20, 14, fill=0, stroke=1); c.line(cx - 10, cy + 2, cx + 10, cy + 2); c.line(cx - 6, cy - 3, cx, cy - 3)
    elif name == "support":
        c.arc(cx - 9, cy - 9, cx + 9, cy + 9, 0, 180); c.line(cx - 9, cy, cx - 9, cy - 6); c.line(cx + 9, cy, cx + 9, cy - 6); c.circle(cx + 7, cy - 7, 2, fill=1, stroke=0)
    else:
        centered(c, name[:1].upper(), cx, cy - 4, size=11, color=color, bold=True)


def header(c: canvas.Canvas, section: str, title_value: str, subtitle: str, page: int) -> None:
    text(c, "MENULY", 42, HEIGHT - 48, 10, ORANGE, True)
    text(c, section.upper(), 42, HEIGHT - 82, 8, MUTED, True)
    text(c, title_value, 42, HEIGHT - 118, 25, INK, True)
    lines(c, subtitle, 42, HEIGHT - 142, 82, size=10, leading=14, color=MUTED, max_lines=2)
    c.setStrokeColor(LINE); c.line(42, HEIGHT - 174, WIDTH - 42, HEIGHT - 174)
    text(c, f"Manual visual del restaurante  |  menuly.es", 42, 27, 7, MUTED)
    text(c, f"{page:02d}", WIDTH - 55, 27, 7, MUTED, True)


def step_card(c: canvas.Canvas, number: int, title_value: str, body: str, x: float, y: float, w: float, h: float, tone=ORANGE) -> None:
    rounded(c, x, y, w, h, WHITE, radius=12, stroke=LINE)
    c.setFillColor(tone); c.circle(x + 24, y + h - 24, 13, fill=1, stroke=0)
    centered(c, str(number), x + 24, y + h - 28, 9, WHITE, True)
    text(c, title_value, x + 45, y + h - 28, 10, INK, True)
    lines(c, body, x + 16, y + h - 50, 42, size=8.2, leading=11.5, color=MUTED, max_lines=5)


def tip(c: canvas.Canvas, value: str, x=42, y=58, w=511, tone=GREEN) -> None:
    bg = GREEN_LIGHT if tone == GREEN else YELLOW_LIGHT if tone == YELLOW else RED_LIGHT
    rounded(c, x, y, w, 58, bg, radius=10)
    icon(c, "alert" if tone != GREEN else "support", x + 12, y + 14, 30, tone, WHITE)
    lines(c, value, x + 54, y + 37, 78, size=8.5, leading=11, color=INK, max_lines=3)


def mock_dashboard(c: canvas.Canvas, x: float, y: float, w: float, h: float, labels: list[str], active=0) -> None:
    rounded(c, x, y, w, h, NAVY, radius=16)
    rounded(c, x + 12, y + 12, w - 24, h - 24, WHITE, radius=10)
    text(c, "Menuly", x + 25, y + h - 48, 11, INK, True)
    for i, label in enumerate(labels[:6]):
        row_y = y + h - 82 - i * 43
        rounded(c, x + 22, row_y, w - 44, 31, ORANGE_LIGHT if i == active else PAPER, radius=7)
        c.setFillColor(ORANGE if i == active else LINE); c.circle(x + 37, row_y + 15.5, 5, fill=1, stroke=0)
        text(c, label, x + 50, row_y + 11.5, 7.7, INK, i == active)


def mock_phone(c: canvas.Canvas, x: float, y: float, w: float, h: float, mode="feed") -> None:
    rounded(c, x, y, w, h, NAVY, radius=24)
    rounded(c, x + 7, y + 7, w - 14, h - 14, HexColor("#352D28"), radius=19)
    c.setFillColor(HexColor("#765948")); c.rect(x + 7, y + h * .42, w - 14, h * .48, fill=1, stroke=0)
    centered(c, "Menuly", x + w / 2, y + h - 30, 8, WHITE, True)
    if mode == "list":
        rounded(c, x + 16, y + h - 70, w - 32, 24, WHITE, radius=7)
        text(c, "Carta por categorías", x + 24, y + h - 61, 6.5, INK, True)
        for row in range(3):
            for col in range(2):
                bx=x+16+col*(w-38)/2; by=y+h-117-row*71
                rounded(c,bx,by,(w-42)/2,60,WHITE,radius=7)
                rounded(c,bx+5,by+22,(w-52)/2,31,ORANGE_LIGHT,radius=5)
                text(c,"Plato",bx+6,by+11,5.5,INK,True)
    else:
        text(c, "DESTACADO", x + 18, y + 145, 5.5, YELLOW, True)
        text(c, "Hamburguesa", x + 18, y + 124, 11, WHITE, True)
        text(c, "12,90 EUR", x + 18, y + 105, 7.5, YELLOW, True)
        rounded(c, x + w - 70, y + 92, 51, 25, YELLOW, radius=7)
        centered(c, "+ Añadir", x + w - 44.5, y + 101, 6, INK, True)
        text(c, "Descripción y alérgenos", x + 18, y + 79, 6.2, WHITE)
        rounded(c, x + 15, y + 15, w - 30, 38, NAVY, radius=8)
        for i in range(5): c.circle(x + 29 + i * ((w - 58) / 4), y + 34, 3, fill=0, stroke=1)


def mock_chart(c: canvas.Canvas, x: float, y: float, w: float, h: float) -> None:
    rounded(c, x, y, w, h, WHITE, radius=14, stroke=LINE)
    text(c, "Últimos 30 días", x + 18, y + h - 34, 9, INK, True)
    metrics=[("Visitas","842"),("Carrito","126"),("Conversión","15%")]
    for i,(label,value) in enumerate(metrics):
        bx=x+16+i*(w-44)/3
        rounded(c,bx,y+h-105,(w-56)/3,55,PAPER,radius=8)
        text(c,value,bx+9,y+h-78,12,ORANGE,True); text(c,label,bx+9,y+h-95,5.8,MUTED)
    pts=[(0,.15),(.18,.35),(.36,.27),(.54,.57),(.72,.48),(1,.78)]
    c.setStrokeColor(ORANGE); c.setLineWidth(3)
    for a,b in zip(pts,pts[1:]):
        c.line(x+22+a[0]*(w-44),y+35+a[1]*(h-165),x+22+b[0]*(w-44),y+35+b[1]*(h-165))


PAGES = [
    dict(section="Empieza aquí", title="Tu ruta para publicar", subtitle="Sigue este recorrido una sola vez. Después solo tendrás que mantener precios, disponibilidad y contenido.", visual="flow", steps=[
        ("Crea tu cuenta","Regístrate con el correo del negocio y una contraseña de 8 caracteres o más."),
        ("Configura el restaurante","Añade datos, logo, idioma, moneda y enlaces públicos."),
        ("Construye la carta","Crea categorías y productos; sube una foto o un vídeo por plato."),
        ("Revisa y publica","Abre la vista cliente, comprueba el QR y activa la publicación."),
    ], tip="Orden recomendado: Restaurante > Carta > Apariencia > Código QR. El panel te marcará el siguiente paso pendiente."),
    dict(section="Acceso", title="Crear cuenta e iniciar sesión", subtitle="Tu correo identifica el restaurante. Usa siempre una cuenta a la que tengas acceso.", visual="login", steps=[
        ("Crear cuenta","Pulsa Crear mi carta, escribe correo y contraseña y confirma el registro."),
        ("Ver la contraseña","Pulsa el icono del ojo para comprobarla antes de continuar."),
        ("Volver a entrar","El navegador puede guardar tus credenciales para futuros accesos."),
        ("Recuperar acceso","Usa He olvidado mi contraseña y abre el enlace recibido por correo."),
    ], tip="No compartas la contraseña principal. Para trabajadores utiliza la sección Equipo."),
    dict(section="Inicio", title="Tu centro de control", subtitle="Inicio resume el estado real de la carta y te lleva directamente a la acción más importante.", visual="dashboard", active=0, labels=["Inicio","Carta","Apariencia","Analíticas","Restaurante","Suscripción"], steps=[
        ("Mira el estado","Comprueba si la carta está publicada y cuántos productos tienen contenido visual."),
        ("Sigue la guía","La puesta en marcha muestra 5 tareas y enlaza la siguiente pendiente."),
        ("Atiende prioridades","Los avisos destacan prueba, contenido incompleto, tráfico o conversión."),
        ("Abre como cliente","Usa Ver carta para comprobar exactamente lo que verá una mesa."),
    ], tip="Si Inicio indica Todo está en orden, la carta no tiene ninguna acción urgente detectada."),
    dict(section="Restaurante", title="Configura el negocio", subtitle="Estos datos identifican el establecimiento y completan la información pública de la carta.", visual="dashboard", active=4, labels=["Datos básicos","Enlaces públicos","Idioma","Moneda","Zona horaria"], steps=[
        ("Datos básicos","Guarda nombre, teléfono, correo, dirección y descripción del restaurante."),
        ("Slug público","Es la parte final del enlace. Evita cambiarlo después de imprimir el QR."),
        ("Enlaces","Añade web e Instagram para mostrarlos desde la información pública."),
        ("Localización","Elige idioma base, moneda y zona horaria correctos."),
    ], tip="Revisa teléfono, dirección y precios antes de colocar el QR en las mesas."),
    dict(section="Carta", title="Crear y ordenar categorías", subtitle="Las categorías ayudan al cliente a llegar rápido a hamburguesas, bebidas, postres o cualquier sección.", visual="dashboard", active=1, labels=["Carta","Nueva categoría","Nombre","Visible","Orden"], steps=[
        ("Crear","En Carta, abre Categorías, escribe un nombre breve y guarda."),
        ("Ordenar","Arrastra las categorías para decidir cómo aparecen al cliente."),
        ("Editar","Selecciona una categoría, cambia el nombre y guarda otra vez."),
        ("Ocultar o eliminar","Oculta temporalmente o elimina solo cuando ya no la necesites."),
    ], tip="Primero crea las categorías. Después cada producto podrá asignarse a una de ellas."),
    dict(section="Carta", title="Añadir o editar un producto", subtitle="Una ficha clara mejora la decisión de compra y alimenta automáticamente la carta en vídeo y la carta listada.", visual="product", steps=[
        ("Nuevo producto","Pulsa Añadir producto y elige su categoría."),
        ("Información","Escribe nombre, descripción y precio final."),
        ("Disponibilidad","Activa Disponible para mostrarlo; desactívalo si se agota."),
        ("Guardar","Guarda y comprueba la miniatura en el listado de Carta."),
    ], tip="Escribe nombres cortos y descripciones útiles. La traducción inglesa se genera automáticamente al guardar."),
    dict(section="Producto", title="Alérgenos y venta adicional", subtitle="Informa con claridad y recomienda hasta tres productos complementarios del mismo restaurante.", visual="allergens", steps=[
        ("Marca alérgenos","Selecciona los grupos presentes en el producto y guarda."),
        ("Comprueba el aviso","El cliente los verá dentro de Descripción, después del texto del plato."),
        ("Añade recomendaciones","Elige hasta 3 bebidas, acompañamientos o postres."),
        ("Mide el resultado","Analíticas separa los añadidos normales y los de recomendaciones."),
    ], tip="La información de alérgenos debe confirmarse siempre con el personal y mantenerse actualizada."),
    dict(section="Multimedia", title="Subir foto o vídeo", subtitle="Cada producto admite una foto o un vídeo. El vídeo es vertical; la foto sirve también como portada en la carta listada.", visual="media", steps=[
        ("Elige el producto","Abre Carta y pulsa el selector multimedia del plato."),
        ("Selecciona archivo","Admite imagen y vídeo, incluidos archivos MOV compatibles."),
        ("Espera la confirmación","No cierres la página mientras aparece el progreso de subida."),
        ("Revisa la portada","Del vídeo se genera una miniatura automática; puedes sustituirla."),
    ], tip="Para que cargue rápido: vídeo vertical 9:16, buena luz, menos de 50 MB y solo los segundos necesarios."),
    dict(section="Carta", title="Ordenar, ocultar y eliminar", subtitle="Mantén el orden de venta sin borrar información por error.", visual="dashboard", active=2, labels=["Producto visible","Arrastrar","Editar","Agotado","Eliminar"], steps=[
        ("Ordenar platos","Arrastra cada producto dentro de su categoría."),
        ("Marcar agotado","Desactiva Disponible: desaparece de la carta pública sin borrarse."),
        ("Editar","Cambia texto, precio, categoría, alérgenos o contenido visual."),
        ("Eliminar","Usa Eliminar solo si no volverás a venderlo y confirma la acción."),
    ], tip="Para un agotado temporal usa Ocultar. Reservar Eliminar evita tener que reconstruir la ficha."),
    dict(section="Apariencia", title="Logo y plantillas", subtitle="Personaliza la identidad sin tocar colores manualmente. Las plantillas controlan el estilo completo.", visual="templates", steps=[
        ("Subir logo","Usa PNG transparente, legible sobre fondos claros y oscuros."),
        ("Previsualizar","Mira cada plantilla con un producto real antes de elegir."),
        ("Seleccionar","Guarda una plantilla gratuita o una premium si tu plan lo permite."),
        ("Comprobar","Abre la carta pública en móvil y ordenador."),
    ], tip="No se utiliza portada del restaurante. El logo es la única imagen de marca global."),
    dict(section="Apariencia", title="Idioma automático", subtitle="El restaurante escribe en español. Menuly genera la versión inglesa y el cliente puede cambiar el idioma.", visual="language", steps=[
        ("Escribe en español","Guarda categorías, productos y descripción normalmente."),
        ("Traducción automática","La versión inglesa se crea al guardar el contenido."),
        ("Activar selector","En Apariencia habilita Mostrar selector de idioma."),
        ("Regenerar todo","Pulsa Traducir ahora toda la carta después de muchos cambios."),
    ], tip="Si tu clientela es solo hispanohablante, deja el selector desactivado."),
    dict(section="Publicación", title="Revisar y publicar", subtitle="Publicar hace visible la carta; despublicar conserva todo el contenido y retira el acceso público.", visual="publish", steps=[
        ("Vista cliente","Desde Carta pulsa Abrir carta y revisa orden, vídeos y precios."),
        ("Prueba dos formatos","Comprueba el feed vertical y la carta listada por categorías."),
        ("Activa publicación","En Inicio o Restaurante cambia el estado a Publicada."),
        ("Verifica fuera del panel","Abre el enlace en otro móvil o escanea el QR."),
    ], tip="No publiques hasta que cada producto visible tenga precio, categoría y una imagen o vídeo correcto."),
    dict(section="Experiencia cliente", title="Carta vertical en vídeo", subtitle="El cliente desliza un plato por pantalla y usa controles compactos sin instalar ninguna aplicación.", visual="phone", steps=[
        ("Deslizar","Un gesto vertical lleva al siguiente producto; las categorías se deslizan en horizontal."),
        ("Abrir descripción","Muestra descripción, alérgenos y recomendaciones en el mismo panel."),
        ("Controlar sonido","El cliente puede activar o silenciar el vídeo."),
        ("Compartir","El botón Compartir envía el enlace del restaurante."),
    ], tip="Menuly precarga los vídeos cercanos. Aun así, los archivos cortos y comprimidos mejoran la experiencia."),
    dict(section="Experiencia cliente", title="Carta listada y carrito", subtitle="La vista listada permite buscar rápido por categorías y muestra dos productos por fila.", visual="list", steps=[
        ("Abrir Carta","El icono de lista cambia del feed a la carta por categorías."),
        ("Añadir","El botón responde visualmente y aumenta el contador del carrito."),
        ("Observaciones","En Carrito puede escribir Añade o quita ingredientes."),
        ("Revisar total","Puede cambiar cantidades o eliminar productos antes de decidir."),
    ], tip="El carrito se guarda en el dispositivo. No cobra, no envía pedidos y no llega a cocina."),
    dict(section="Código QR", title="Descargar y colocar el QR", subtitle="El mismo código seguirá funcionando cuando cambies productos, precios o vídeos.", visual="qr", steps=[
        ("Abrir Código QR","Comprueba que debajo aparece el enlace de tu restaurante."),
        ("Descargar","Guarda el archivo original en buena resolución."),
        ("Probar","Escanéalo desde un móvil diferente antes de imprimir."),
        ("Colocar","Usa buen contraste y conserva el margen blanco alrededor."),
    ], tip="No imprimas un QR hasta decidir el slug público definitivo del restaurante."),
    dict(section="Analíticas", title="Mejorar ventas con datos", subtitle="Los datos son agregados y privados. Sirven para detectar interés, abandono y oportunidades de venta adicional.", visual="chart", steps=[
        ("Elige periodo","Compara 7, 30 o 90 días con el periodo anterior."),
        ("Lee el embudo","Visitas > productos vistos > vídeos > añadidos al carrito."),
        ("Actúa","Sigue las recomendaciones sobre productos y categorías con oportunidad."),
        ("Comparte o exporta","Descarga CSV y comparte el resumen semanal por WhatsApp."),
    ], tip="Los añadidos al carrito indican intención de compra; no son ventas confirmadas."),
    dict(section="Analíticas", title="Objetivos semanales", subtitle="Convierte las métricas en una rutina sencilla y medible.", visual="goals", steps=[
        ("Define visitas","Escribe una meta semanal realista para aperturas de carta."),
        ("Define añadidos","Marca cuántos añadidos al carrito quieres conseguir."),
        ("Revisa progreso","La barra muestra cuánto falta para alcanzar cada objetivo."),
        ("Mejora una cosa","Cambia portada, orden, descripción o recomendación y vuelve a medir."),
    ], tip="Haz un cambio cada vez. Así sabrás qué mejora produjo el resultado."),
    dict(section="Equipo", title="Invitar colaboradores", subtitle="Cada persona usa su propia cuenta. No es necesario compartir la contraseña del propietario.", visual="team", steps=[
        ("Invitar","Escribe el correo del colaborador y selecciona su rol."),
        ("Editor","Puede mantener la carta y el contenido del restaurante."),
        ("Administrador","Puede gestionar además configuraciones y miembros permitidos."),
        ("Cambiar o eliminar","Actualiza el rol o retira el acceso cuando sea necesario."),
    ], tip="Aplica el permiso mínimo necesario y elimina accesos de personas que ya no trabajen contigo."),
    dict(section="Suscripción", title="Prueba, plan y sugerencias", subtitle="Consulta el estado del servicio y envía ideas directamente al equipo de Menuly.", visual="billing", steps=[
        ("Prueba de 7 días","Permite hasta 3 productos y un máximo de 5 categorías."),
        ("Fin de prueba","Sin pago registrado, la carta pública se suspende; el panel conserva los datos."),
        ("Plan activo","Muestra el acceso profesional y las plantillas disponibles."),
        ("Enviar sugerencia","Escribe qué añadirías, quitarías o mejorarías y pulsa Enviar."),
    ], tip="Durante la beta los pagos se registran manualmente. Menuly no realiza cargos automáticos."),
    dict(section="Rutina", title="Revisión antes del servicio", subtitle="Cinco minutos de comprobación evitan errores visibles durante la hora punta.", visual="check", steps=[
        ("Disponibilidad","Oculta platos agotados y confirma productos del día."),
        ("Precios y alérgenos","Revisa cambios recientes y comunica cualquier sustitución."),
        ("Vídeos y miniaturas","Abre la carta y reproduce los primeros productos."),
        ("QR y carrito","Escanea una mesa, añade un plato y abre el carrito."),
    ], tip="Haz esta revisión también después de editar el slug, cambiar de plantilla o subir muchos vídeos."),
    dict(section="Ayuda", title="Resolver incidencias", subtitle="Estas comprobaciones rápidas solucionan la mayoría de problemas sin perder información.", visual="support", steps=[
        ("La carta no abre","Prueba el enlace escrito, otra red y otro dispositivo."),
        ("El vídeo no reproduce","Comprueba formato, tamaño, conexión y vuelve a subirlo si es necesario."),
        ("Un cambio no aparece","Confirma que guardaste, recarga la página y revisa disponibilidad."),
        ("Pedir ayuda","Envía enlace exacto, captura, dispositivo y hora aproximada del fallo."),
    ], tip="Soporte Menuly 24/7 por WhatsApp: +34 643 663 194. Nunca envíes contraseñas ni claves privadas."),
    dict(section="Mapa rápido", title="¿Dónde se hace cada cosa?", subtitle="Usa este mapa cuando sepas qué quieres cambiar, pero no recuerdes en qué sección está.", visual="map", steps=[
        ("Carta","Categorías, productos, precio, foto/vídeo, alérgenos, recomendaciones, orden y disponibilidad."),
        ("Apariencia","Logo, plantilla, selector de idioma y traducción completa."),
        ("Restaurante y Equipo","Datos, enlaces, localización, colaboradores y roles."),
        ("QR, Analíticas y Suscripción","Compartir, medir, exportar, revisar plan y enviar sugerencias."),
    ], tip="Menuly evoluciona. Si la interfaz cambia, la versión visible en tu cuenta siempre prevalece sobre este manual."),
]


def draw_visual(c: canvas.Canvas, kind: str, x: float, y: float, w: float, h: float, page: dict) -> None:
    rounded(c, x, y, w, h, PAPER, radius=16, stroke=LINE)
    if kind in ("phone", "list"):
        mock_phone(c, x + 28, y + 24, w - 56, h - 48, "list" if kind == "list" else "feed")
    elif kind == "chart":
        mock_chart(c, x + 14, y + 60, w - 28, h - 120)
    elif kind == "qr":
        rounded(c,x+32,y+95,w-64,w-64,WHITE,radius=10)
        cells={(r*7+c2*3+r*c2)%5<2 for r in range(13) for c2 in range(13)}
        cell=(w-88)/13
        for r in range(13):
            for col in range(13):
                if (r*7+col*3+r*col)%5<2:
                    c.setFillColor(INK); c.rect(x+44+col*cell,y+107+r*cell,cell,cell,fill=1,stroke=0)
        centered(c,"ESCANEA TU CARTA",x+w/2,y+66,8,INK,True)
        centered(c,"menuly.es/r/tu-restaurante",x+w/2,y+48,6,MUTED)
    elif kind == "team":
        for i,(label,tone) in enumerate((("Propietario",ORANGE),("Admin",GREEN),("Editor",YELLOW))):
            cy=y+h-90-i*105
            icon(c,"team",x+22,cy,38,tone,WHITE)
            text(c,label,x+72,cy+19,9,INK,True)
            lines(c,"Cuenta propia y permisos controlados",x+72,cy+4,25,size=6.5,leading=9,max_lines=2)
            if i<2:
                c.setStrokeColor(LINE); c.line(x+w/2,cy-8,x+w/2,cy-33)
    elif kind == "billing":
        for i,(label,value,tone) in enumerate((("Prueba","7 días",ORANGE),("Límite","3 productos",YELLOW),("Categorías","máximo 5",GREEN))):
            by=y+h-92-i*88
            rounded(c,x+18,by,w-36,66,WHITE,radius=10,stroke=LINE)
            text(c,label,x+32,by+42,7,MUTED,True); text(c,value,x+32,by+19,13,tone,True)
    elif kind == "language":
        centered(c,"ES",x+w/2-42,y+h-105,20,ORANGE,True); centered(c,"EN",x+w/2+42,y+h-105,20,GREEN,True)
        c.setStrokeColor(LINE); c.setLineWidth(2); c.line(x+w/2-15,y+h-100,x+w/2+15,y+h-100)
        for i,label in enumerate(("Categorías","Productos","Descripción")):
            by=y+h-180-i*55
            rounded(c,x+20,by,w-40,39,WHITE,radius=8,stroke=LINE); centered(c,label,x+w/2,by+14,7.5,INK,True)
    elif kind == "templates":
        colors=[ORANGE,GREEN,YELLOW,NAVY]
        for i in range(4):
            bx=x+18+(i%2)*(w/2-4); by=y+h-145-(i//2)*150
            rounded(c,bx,by,w/2-32,128,colors[i],radius=14)
            rounded(c,bx+10,by+10,w/2-52,63,WHITE,radius=8)
            centered(c,("Cinemática","Mediterránea","Sakura","Art Déco")[i],bx+(w/2-32)/2,by+92,6.5,WHITE if i!=2 else INK,True)
    elif kind in ("dashboard", "publish"):
        mock_dashboard(c,x+12,y+22,w-24,h-44,page.get("labels",["Vista cliente","Carta publicada","Código QR","Compartir"]),page.get("active",0))
    elif kind == "product":
        mock_phone(c,x+30,y+24,w-60,h-48,"feed")
    elif kind == "media":
        icon(c,"media",x+w/2-25,y+h-105,50,ORANGE,WHITE)
        text(c,"FOTO",x+34,y+h-170,10,INK,True); text(c,"VÍDEO",x+w-84,y+h-170,10,INK,True)
        c.setStrokeColor(LINE); c.line(x+w/2,y+75,x+w/2,y+h-145)
        rounded(c,x+22,y+95,w-44,55,WHITE,radius=10,stroke=LINE)
        centered(c,"Miniatura automática + cambio manual",x+w/2,y+117,6.8,MUTED,True)
    elif kind == "allergens":
        for i,label in enumerate(("Gluten","Huevos","Leche","Frutos secos","Pescado","Soja")):
            bx=x+18+(i%2)*(w/2-3); by=y+h-88-(i//2)*55
            rounded(c,bx,by,w/2-31,38,WHITE,radius=10,stroke=LINE)
            c.setFillColor(ORANGE); c.circle(bx+16,by+19,5,fill=1,stroke=0); text(c,label,bx+28,by+15,6.6,INK,True)
        rounded(c,x+18,y+48,w-36,80,GREEN_LIGHT,radius=12)
        centered(c,"+ 3 recomendaciones",x+w/2,y+92,9,GREEN,True)
        centered(c,"bebida  |  acompañamiento  |  postre",x+w/2,y+69,5.8,MUTED)
    elif kind == "login":
        icon(c,"user",x+w/2-22,y+h-92,44,ORANGE,WHITE)
        for i,label in enumerate(("Correo del negocio","Contraseña  ••••••••")):
            by=y+h-160-i*60; rounded(c,x+20,by,w-40,42,WHITE,radius=9,stroke=LINE); text(c,label,x+32,by+16,7,MUTED)
        rounded(c,x+20,y+86,w-40,42,ORANGE,radius=9); centered(c,"Entrar",x+w/2,y+102,8,WHITE,True)
        centered(c,"¿Has olvidado la contraseña?",x+w/2,y+61,6.2,MUTED)
    elif kind == "goals":
        for i,(label,pct,tone) in enumerate((("Visitas",.72,ORANGE),("Añadidos",.48,GREEN))):
            by=y+h-115-i*125; text(c,label,x+24,by+54,9,INK,True); text(c,f"{int(pct*100)}%",x+w-52,by+54,9,tone,True)
            rounded(c,x+24,by+22,w-48,15,LINE,radius=7); rounded(c,x+24,by+22,(w-48)*pct,15,tone,radius=7)
    elif kind == "flow":
        for i,label in enumerate(("Cuenta","Restaurante","Carta","Publicar")):
            cy=y+h-70-i*90
            icon(c,("user","store","dish","publish")[i],x+24,cy-15,38,ORANGE if i<3 else GREEN,WHITE)
            text(c,label,x+76,cy,9,INK,True)
            if i<3:
                c.setStrokeColor(LINE); c.setLineWidth(2); c.line(x+43,cy-25,x+43,cy-59)
    else:
        labels=("Carta","Apariencia","Restaurante","Analíticas","Equipo","QR")
        icons=("dish","palette","store","chart","team","qr")
        for i,label in enumerate(labels):
            bx=x+18+(i%2)*(w/2-3); by=y+h-92-(i//2)*83
            rounded(c,bx,by,w/2-31,64,WHITE,radius=10,stroke=LINE); icon(c,icons[i],bx+9,by+15,32); text(c,label,bx+48,by+27,6.7,INK,True)


def draw_content_page(c: canvas.Canvas, page: dict, number: int) -> None:
    c.setFillColor(PAPER); c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    header(c, page["section"], page["title"], page["subtitle"], number)
    visual_x, visual_y, visual_w, visual_h = 42, 154, 205, 494
    draw_visual(c, page["visual"], visual_x, visual_y, visual_w, visual_h, page)
    steps = page["steps"]
    gap = 10
    available = visual_h
    card_h = (available - gap * (len(steps) - 1)) / len(steps)
    for i, (title_value, body) in enumerate(steps):
        card_y = visual_y + visual_h - (i + 1) * card_h - i * gap
        step_card(c, i + 1, title_value, body, 267, card_y, 286, card_h)
    tip(c, page["tip"])
    c.showPage()


def cover(c: canvas.Canvas) -> None:
    c.setFillColor(NAVY); c.rect(0,0,WIDTH,HEIGHT,fill=1,stroke=0)
    c.setFillColor(ORANGE); c.circle(WIDTH+25,HEIGHT-95,145,fill=1,stroke=0)
    c.setFillColor(HexColor("#3D2452")); c.circle(-25,35,150,fill=1,stroke=0)
    rounded(c,42,HEIGHT-105,105,32,WHITE,radius=16)
    centered(c,"Menuly",94.5,HEIGHT-94,10,NAVY,True)
    text(c,"Manual visual",42,HEIGHT-220,34,WHITE,True)
    text(c,"del restaurante",42,HEIGHT-264,34,WHITE,True)
    lines(c,"Todo lo que puedes hacer, explicado con pasos rápidos e infografías.",42,HEIGHT-310,48,size=13,leading=18,color=HexColor("#D5D7E2"),max_lines=3)
    mock_phone(c,WIDTH-245,126,166,340,"feed")
    text(c,"GUÍA COMPLETA",42,132,9,YELLOW,True)
    text(c,"Cuenta  |  Carta  |  Vídeo  |  QR  |  Analíticas",42,108,9,WHITE,True)
    text(c,"Soporte 24/7  |  WhatsApp +34 643 663 194",42,78,8,HexColor("#D5D7E2"))
    text(c,"Edición julio de 2026",42,52,7,HexColor("#9EA3B5"))
    c.showPage()


def main() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    pdf.setTitle("Menuly - Manual visual del restaurante")
    pdf.setAuthor("Menuly")
    pdf.setSubject("Guía visual completa para gestionar una carta digital Menuly")
    cover(pdf)
    for number, page in enumerate(PAGES, start=2):
        draw_content_page(pdf, page, number)
    pdf.save()
    PUBLIC.write_bytes(OUTPUT.read_bytes())


if __name__ == "__main__":
    main()
