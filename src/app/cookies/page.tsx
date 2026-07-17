import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {LegalPage, LegalSection} from "@/components/legal/legal-page";
import {getLegalIdentity} from "@/lib/legal";

export const metadata:Metadata={title:"Cookies | Carta Video",robots:{index:false,follow:false}};

export default function CookiesPage(){const identity=getLegalIdentity();if(!identity.complete)notFound();return <LegalPage title="Política de cookies y almacenamiento local" summary="Carta Video no utiliza cookies publicitarias ni de seguimiento. Aquí se detallan los almacenamientos técnicos necesarios." identity={identity}>
  <LegalSection title="1. Qué utilizamos"><p>El área de administración utiliza cookies técnicas de sesión y autenticación para mantener el acceso seguro. Pueden existir datos técnicos de sesión, como el restaurante activo, necesarios para navegar por el panel. Su duración se limita a la sesión o al periodo técnicamente necesario.</p></LegalSection>
  <LegalSection title="2. Carrito de la carta pública"><p>La carta guarda el carrito en el almacenamiento local del navegador bajo una clave asociada al restaurante. Incluye productos, cantidades y observaciones, permanece hasta que se vacía o se borran los datos del navegador y no se transmite a cocina ni al servidor como pedido.</p></LegalSection>
  <LegalSection title="3. Multimedia y terceros"><p>El navegador puede almacenar temporalmente imágenes y vídeos para mejorar la reproducción. Al solicitar archivos a proveedores multimedia, estos reciben datos técnicos de conexión, como la IP y el navegador, necesarios para entregar el contenido. Carta Video no incorpora cookies analíticas, publicitarias ni perfiles comerciales.</p></LegalSection>
  <LegalSection title="4. Consentimiento"><p>Al utilizar únicamente almacenamiento estrictamente necesario, no se muestra un panel de consentimiento. Si en el futuro se añaden analítica no esencial, publicidad u otros rastreadores, se actualizará esta política y se solicitará consentimiento antes de activarlos.</p></LegalSection>
  <LegalSection title="5. Cómo eliminarlos"><p>Puedes borrar cookies y almacenamiento local desde los ajustes de privacidad del navegador. Si eliminas las cookies de autenticación tendrás que iniciar sesión de nuevo; si eliminas el almacenamiento local se perderá el carrito guardado.</p></LegalSection>
  <LegalSection title="6. Contacto"><p>Para consultas sobre estas tecnologías, escribe a {identity.email}.</p></LegalSection>
</LegalPage>}
