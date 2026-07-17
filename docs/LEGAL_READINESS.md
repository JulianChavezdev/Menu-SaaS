# Textos legales de Carta Video

Estado: borradores técnicos preparados, pendientes de identidad del titular y revisión profesional.

## Publicación

Las rutas `/legal`, `/privacidad`, `/cookies`, `/condiciones` y `/encargo-datos` devuelven 404 y no aparecen en el pie hasta completar estas variables en Vercel:

```env
NEXT_PUBLIC_LEGAL_NAME=Nombre y apellidos o razón social
NEXT_PUBLIC_LEGAL_TAX_ID=NIF o CIF
NEXT_PUBLIC_LEGAL_ADDRESS=Domicilio completo
NEXT_PUBLIC_LEGAL_EMAIL=correo de privacidad y contratación
NEXT_PUBLIC_LEGAL_PHONE=teléfono opcional
NEXT_PUBLIC_LEGAL_REGISTRY=datos registrales, si corresponden
```

Comprobar antes del despliegue:

```bash
npm run check:legal
```

Después de guardar las variables es necesario volver a desplegar, porque las variables `NEXT_PUBLIC_*` se incorporan durante la compilación.

## Revisión previa obligatoria

- Confirmar si el titular contrata como persona física, autónomo o sociedad.
- Confirmar si los precios muestran IVA incluido o no y reflejarlo antes de aceptar pagos.
- Revisar contratos, regiones de tratamiento y transferencias de Supabase, Vercel, Cloudinary, DeepL y Stripe.
- Firmar o aceptar el acuerdo de encargo con cada restaurante cuando se traten datos por su cuenta.
- Definir plazos internos exactos de conservación y respuesta a incidencias.
- Sustituir la activación manual por un flujo que guarde aceptación, versión de condiciones, fecha y prueba del consentimiento contractual.
- Revisar los textos con una asesoría jurídica española antes de abrir contratación real.
- Rotar cualquier secreto de Supabase que se haya compartido fuera de Vercel o del gestor de secretos.

## Límites reflejados en los textos

- Prueba: siete días, tres productos y cinco categorías.
- Plan Carta: 34,99 € al mes; anual con ahorro aproximado del 18 %.
- Llave en mano: 149,99 € al mes, primer mes gratis, cuatro vídeos por un máximo de cinco categorías.
- Pagos manuales durante la beta, sin cargo automático.
- El carrito es local y no envía comandas ni pedidos a cocina.
- Las traducciones y los alérgenos deben ser revisados por el restaurante.

## Referencias oficiales usadas

- RGPD: https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es
- LSSI, incluida la información obligatoria del prestador: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- Ley General para la Defensa de los Consumidores y Usuarios: https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555
- Orientaciones de la AEPD sobre información por capas: https://www.aepd.es/prensa-y-comunicacion/blog/la-importancia-de-la-informacion-por-capas-en-el-reglamento-general-de
