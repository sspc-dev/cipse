/** Diccionario fuente (español). Su forma define el tipo `Dictionary`. */
export const es = {
  common: {
    event: "CIPSE XV · México 2026",
    org: "Gobierno de México · SSPC",
    registerLink: "Registro",
    languageSwitcherLabel: "Cambiar idioma",
    languageName: "Español",
    themeLabel: "Selección de tema",
    themeLight: "Modo claro",
    themeDark: "Modo oscuro",
    themeSystem: "Según el sistema",
  },
  metadata: {
    rootTitle: "Registro de acreditación — CIPSE XV",
    rootDescription:
      "Solicite su acreditación para el CIPSE XV, Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026. Organizado por la SSPC.",
    registerTitle: "Registro de acreditación — CIPSE XV",
    registerDescription:
      "Solicite su acreditación para el CIPSE XV, Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026.",
    mediaTitle: "Multimedia — CIPSE XV",
    mediaDescription:
      "Galería de imágenes, videos y documentos del Congreso Internacional Policial contra el Secuestro y la Extorsión, CIPSE XV, México 2026.",
    checkinTitle: "Registro de asistencia — CIPSE XV",
    checkinDescription:
      "Verificación de credenciales y registro de asistencia para el personal acreditado del CIPSE XV.",
  },
  register: {
    sealAlt: "Sello de la Secretaría de Seguridad y Protección Ciudadana",
    coverAlt: "Elementos de la SSPC en despliegue operativo",
    sspcLogoAlt: "Logo de la Secretaría de Seguridad y Protección Ciudadana",
    govLogoAlt: "Logo del Gobierno de México",
    badge: "CIPSE · México 2026",
    heading: "Registro de acceso",
    subheading: "Complete sus datos para solicitar el acceso al congreso",
    heroTitle:
      "Congreso Internacional Policial Contra el Secuestro y la Extorsión",
    orgLine: "Gobierno de México · SSPC",
    footer: "CIPSE XV · Acreditación",
    formAriaLabel: "Formulario de registro de acreditación",
    personalData: "Datos personales",
    nameLabel: "Nombre",
    namePlaceholder: "Ej. Alejandro",
    lastnameLabel: "Apellidos",
    lastnamePlaceholder: "Ej. Valenzuela",
    contactHeading: "Datos de contacto",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "nombre@ejemplo.com",
    emailDescription: "Le enviaremos el código de acceso a este correo.",
    submit: "Registrar solicitud",
    errors: {
      name: "Ingrese su nombre.",
      lastname: "Ingrese sus apellidos.",
      country: "Indique su país.",
      email: "Ingrese un correo electrónico válido.",
      duplicateEmail:
        "Este correo electrónico ya tiene una solicitud registrada.",
      generic: "Revise los datos del formulario e intente de nuevo.",
      dbError:
        "No fue posible registrar la solicitud. Intente de nuevo más tarde.",
    },
    toasts: {
      sent: "Solicitud registrada correctamente",
      skipped: "Solicitud registrada (sin envío de correo configurado)",
      failed: "Solicitud registrada (no se pudo enviar el correo)",
      description: "Folio {folio}. Guárdela o descárguela desde la credencial.",
    },
    success: {
      heading: "Solicitud registrada",
      description:
        "Presente este código de acceso el día del congreso. Guardarlo es suficiente para acreditar su ingreso.",
      delegate: "Participante",
      email: "Correo",
      emailSent: "Credencial enviada a {email}",
      emailSkipped: "{email}",
      emailFailed:
        "{email}: no se pudo enviar el correo. Guarde o descargue su credencial aquí.",
      download: "Descargar credencial",
      registerAnother: "Registrar otro participante",
      registerAnotherAria: "Registrar a otra persona desde este dispositivo",
      qrAlt: "Código de acceso {folio} de {name}",
    },
  },
  country: {
    label: "País",
    description: "País de origen de la delegación.",
    placeholder: "Busque y seleccione su país",
    searchLabel: "Buscar país",
    searchPlaceholder: "Buscar país...",
    empty: "Sin países que coincidan",
  },
  media: {
    title: "Multimedia del congreso",
    eyebrow: "Acervo multimedia & registros oficiales",
    heroLine1: "Repositorio & actas del",
    heroHighlight: "XV Congreso Internacional",
    heroLine2: "contra el secuestro y la extorsión",
    heroDescription:
      "Material oficial del CIPSE XV: conferencias, fotografías y documentos institucionales organizados por jornada y tipo de archivo.",
    stats: {
      files: "Archivos publicados",
      days: "Jornadas con material",
      formats: "Formatos disponibles",
    },
    featuredEyebrow: "Registro destacado",
    featuredEmpty:
      "El material oficial se publicará en esta sección conforme avance el congreso.",
    galleryEyebrow: "Galería & ponencias oficiales",
    galleryHeading: "Galería del congreso",
    galleryDescription:
      "Imágenes, videos y documentos oficiales del CIPSE XV, organizados por día de actividad.",
    dayLabel: "Día {n}",
    dayTabsAria: "Filtrar material por jornada",
    filtersAria: "Filtrar por tipo de archivo",
    filterAll: "Todos",
    filters: {
      image: "Fotografías",
      video: "Videos",
      document: "Documentos",
    },
    searchLabel: "Buscar archivos oficiales",
    searchPlaceholder: "Buscar ponencias o archivos...",
    counterLabel: "Archivos",
    noMedia: "Todavía no hay material publicado.",
    noMediaHint:
      "Los archivos oficiales aparecerán aquí cuando el equipo de acreditación los publique.",
    empty: "Aún no hay material publicado para {day}.",
    emptyFiltered: "No se encontraron archivos con los criterios seleccionados.",
    emptyFilteredHint:
      "Seleccione «Todos» o elija otra jornada para revisar más material oficial.",
    openAria: "Abrir {title}",
    openDocument: "Abrir documento",
    openDocumentAria: "Abrir documento {title} en una pestaña nueva",
    kinds: {
      image: "Imagen",
      video: "Video",
      document: "Documento",
    },
    modal: {
      badge: "Vista oficial",
      meta: "Canal oficial del congreso · Archivo verificado",
      imageAlt: "Vista de alta resolución de {title}",
      videoAria: "Reproducción de {title}",
      download: "Descargar archivo oficial",
      closeAria: "Cerrar vista previa",
    },
    downloadPackage: "Descargar paquete (.ZIP)",
    downloadUnavailable: "Disponible próximamente",
    securityNote: "Descarga individual por archivo · Servidores oficiales",
    footer: "Gobierno de México · SSPC — CIPSE XV · Multimedia",
  },
  checkin: {
    title: "Registro de asistencia",
    subtitle: "Personal acreditador del congreso.",
    sealAlt: "Sello de la Secretaría de Seguridad y Protección Ciudadana",
    codeLabel: "Código de credencial",
    codePlaceholder: "Código impreso bajo el QR",
    search: "Buscar",
    invalidCode:
      "El código escaneado no corresponde a una acreditación válida.",
    scanPrompt:
      "Escaneé la credencial QR del participante o ingrese su código manualmente.",
    folio: "Folio",
    delegate: "Participante",
    country: "País",
    alreadyToday: "Ya fue registrada hoy{time}",
    registeredToday: "Asistencia del día registrada{time}",
    timeSuffix: " a las {time}",
    attendanceDays: "Día {n} de asistencia",
    registerAttendance: "Registrar asistencia de hoy",
    footer: "Gobierno de México · SSPC — CIPSE XV · Acreditación",
    errors: {
      sessionRequired:
        "Inicie sesión de acreditador para registrar asistencia.",
      invalidCode: "El código no corresponde a un registro válido.",
      dbError:
        "No fue posible registrar la asistencia. Intente de nuevo más tarde.",
    },
  },
  email: {
    subject: "Credencial de acceso {folio} — CIPSE XV México 2026",
    heading: "Credencial de acceso",
    greeting: "Hola, {name}. Su solicitud quedó registrada con folio {folio}.",
    instructions:
      "Presente este código QR en el acceso del congreso. También encontrará la imagen adjunta para guardar o imprimir.",
    qrAlt: "Código de acceso {folio}",
    footer: "Gobierno de México · SSPC — CIPSE XV.",
    textGreeting:
      "Hola, {name}. Su solicitud quedó registrada con folio {folio}.",
    textInstructions: "Presente su código QR en el acceso del congreso.",
    textCode: "Código de acceso: {code}",
  },
};

export type Dictionary = typeof es;
