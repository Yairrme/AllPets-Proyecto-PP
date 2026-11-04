/**
 * Contenido de las políticas de privacidad.
 *
 * Es el único archivo a editar para modificar el texto: los componentes
 * (PrivacyPolicyContent / Modal / Field) no necesitan cambios.
 */

export interface PrivacyPolicySection {
  /** Identificador único y estable de la sección */
  id: string
  title: string
  /** Un string por párrafo */
  paragraphs: string[]
  /** Lista de puntos opcional, se muestra debajo de los párrafos */
  items?: string[]
}

export interface PrivacyPolicyDocument {
  title: string
  /** Versión del texto (ej: '1.0') */
  version: string
  /** Fecha de última actualización legible (ej: '4 de noviembre de 2026') */
  lastUpdated: string | null
  intro: string
  sections: PrivacyPolicySection[]
}

export const privacyPolicy: PrivacyPolicyDocument = {
  title: 'Políticas de privacidad',
  version: '1.0',
  lastUpdated: '4 de noviembre de 2026',
  intro:
    'All Pets es una plataforma que conecta a dueños de mascotas con paseadores y cuidadores de Cipolletti y Neuquén, y ofrece una tienda de productos para mascotas. Estas políticas explican qué datos personales recopilamos, para qué los usamos y qué derechos tenés sobre ellos. Al registrarte, confirmás que las leíste y las aceptás.',
  sections: [
    {
      id: 'datos',
      title: 'Datos que recopilamos',
      paragraphs: ['Según el tipo de cuenta, recopilamos los siguientes datos:'],
      items: [
        'Datos de tu cuenta: nombre completo, correo electrónico, contraseña, ciudad (Cipolletti o Neuquén), teléfono y rol (cliente, paseador o cuidador).',
        'Foto de perfil, si decidís subirla.',
        'Solo paseadores y cuidadores: descripción, servicios, disponibilidad horaria, tarifa por hora, años de experiencia, tamaños de mascota que aceptás, galería de fotos, certificaciones y comprobantes de permisos.',
        'Reseñas y puntuaciones que dejás o recibís.',
        'Fecha y hora en que aceptaste estas políticas.',
      ],
    },
    {
      id: 'finalidad',
      title: 'Para qué usamos tus datos',
      paragraphs: [],
      items: [
        'Crear y administrar tu cuenta e iniciar tu sesión.',
        'Mostrar los perfiles de paseadores y cuidadores a quienes buscan un servicio.',
        'Permitir que clientes y trabajadores se contacten para coordinar los servicios.',
        'Gestionar reseñas, el carrito de compras y los productos de la tienda.',
        'Revisar y aprobar los perfiles de paseadores y cuidadores antes de publicarlos.',
        'Mantener la seguridad de la plataforma.',
      ],
    },
    {
      id: 'visibilidad',
      title: 'Información visible para otros usuarios',
      paragraphs: [
        'Si te registrás como paseador o cuidador, tu perfil aprobado es público: se muestran tu nombre, ciudad, foto, datos profesionales, reseñas y tu teléfono de contacto, para que los clientes puedan comunicarse con vos. Tu correo electrónico no se muestra en los listados públicos.',
        'Si te registrás como cliente, tus datos personales no son públicos. Tu nombre puede aparecer asociado a las reseñas que dejes.',
      ],
    },
    {
      id: 'consentimiento',
      title: 'Consentimiento',
      paragraphs: [
        'Para crear tu cuenta es obligatorio aceptar estas políticas. Registramos en nuestra base de datos que las aceptaste, junto con la fecha y hora en que lo hiciste. No se te vuelve a pedir la aceptación cada vez que iniciás sesión.',
      ],
    },
    {
      id: 'terceros',
      title: 'Con quién compartimos tus datos',
      paragraphs: [
        'No vendemos tus datos personales. Fuera de lo indicado sobre perfiles públicos, solo los compartimos cuando una autoridad competente lo requiera conforme a la ley.',
      ],
    },
    {
      id: 'seguridad',
      title: 'Seguridad de la información',
      paragraphs: ['Aplicamos medidas técnicas para proteger tus datos:'],
      items: [
        'Las contraseñas se almacenan cifradas (hash) y nunca en texto plano.',
        'Los teléfonos se almacenan cifrados en la base de datos.',
        'El acceso a las funciones privadas requiere iniciar sesión con un token personal.',
        'Tu sesión se guarda en el navegador de tu dispositivo; cerrá sesión si usás un equipo compartido.',
      ],
    },
    {
      id: 'conservacion',
      title: 'Conservación de los datos',
      paragraphs: [
        'Conservamos tus datos mientras tu cuenta permanezca activa. Si pedís que se elimine tu cuenta, eliminaremos tus datos personales, salvo aquellos que debamos conservar por obligación legal.',
      ],
    },
    {
      id: 'derechos',
      title: 'Tus derechos',
      paragraphs: [
        'De acuerdo con la normativa de protección de datos personales de la República Argentina (Ley 25.326), podés:',
      ],
      items: [
        'Acceder a tus datos personales.',
        'Rectificarlos o actualizarlos; podés modificar tus datos desde tu perfil.',
        'Solicitar su supresión.',
      ],
    },
    {
      id: 'cambios',
      title: 'Cambios en estas políticas',
      paragraphs: [
        'Podemos actualizar estas políticas. La versión vigente y su fecha de actualización figuran al inicio de este texto.',
      ],
    },
    {
      id: 'contacto',
      title: 'Contacto',
      paragraphs: [
        'Para consultas sobre privacidad o para ejercer tus derechos, comunicate con el equipo de All Pets a través de los medios de contacto habilitados en la plataforma.',
      ],
    },
  ],
}
