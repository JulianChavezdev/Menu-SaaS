import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {LegalPage, LegalSection} from "@/components/legal/legal-page";
import {getLegalIdentity} from "@/lib/legal";

export const metadata:Metadata={title:"Aviso legal | Menuly",robots:{index:false,follow:false}};

export default function LegalNoticePage(){const identity=getLegalIdentity();if(!identity.complete)notFound();return <LegalPage title="Aviso legal" summary="Información sobre la persona responsable de Menuly y las reglas generales de acceso al sitio." identity={identity}>
  <LegalSection title="1. Titular del sitio"><p>Este sitio y el servicio Menuly son ofrecidos por {identity.name}, con NIF/CIF {identity.taxId} y domicilio en {identity.address}. Puedes contactar en {identity.email}{identity.phone?` o en ${identity.phone}`:""}.{identity.registry&&<> Datos registrales: {identity.registry}.</>}</p></LegalSection>
  <LegalSection title="2. Finalidad"><p>Menuly es una plataforma dirigida principalmente a restaurantes y profesionales de hostelería para crear, gestionar y publicar cartas digitales con contenido audiovisual.</p></LegalSection>
  <LegalSection title="3. Acceso y uso"><p>El acceso público a la web no exige registro. Las funciones de gestión requieren una cuenta. La persona usuaria debe utilizar el sitio de forma lícita, no interferir con su seguridad o disponibilidad y no introducir contenido que vulnere derechos de terceros.</p></LegalSection>
  <LegalSection title="4. Propiedad intelectual"><p>El software, diseño, marca y contenidos propios de Menuly están protegidos por la normativa aplicable. Los restaurantes conservan los derechos sobre el material que suben y conceden únicamente la licencia necesaria para alojarlo, procesarlo y mostrarlo como parte del servicio.</p></LegalSection>
  <LegalSection title="5. Información y disponibilidad"><p>Se adoptan medidas razonables para mantener la información y el servicio disponibles y actualizados. Pueden existir interrupciones por mantenimiento, incidencias o servicios de terceros. Nada de este aviso excluye responsabilidades que no puedan limitarse legalmente.</p></LegalSection>
  <LegalSection title="6. Enlaces externos"><p>Los enlaces a servicios externos, como WhatsApp o proveedores multimedia, se facilitan para funciones concretas. Sus condiciones y políticas se aplican cuando la persona usuaria accede a ellos.</p></LegalSection>
  <LegalSection title="7. Legislación"><p>Se aplica la legislación española. Cualquier controversia se someterá a los juzgados que correspondan conforme a las normas obligatorias de competencia; cuando proceda una relación de consumo, se respetarán íntegramente los derechos de la persona consumidora.</p></LegalSection>
</LegalPage>}
