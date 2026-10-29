<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — CIPSE XV · Congreso Internacional Policial 2026

## 1. Propósito del proyecto

Construir una experiencia web moderna, profesional y visualmente impactante para el **Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026 (CIPSE XV)**.

El sitio debe transmitir seguridad, autoridad institucional, cooperación internacional y excelencia operativa. La experiencia visual debe sentirse como la de un foro internacional de alto nivel, no como una plantilla genérica de evento.

### Objetivos

- Implementar fielmente el diseño visual de referencia y mejorar su consistencia.
- Mantener una arquitectura limpia, modular y mantenible.
- Aprovechar las capacidades de Next.js 16 y React Server Components.
- Utilizar HeroUI mediante su MCP y documentación oficial.
- Separar la interfaz, la lógica de presentación, las reglas de negocio y las operaciones de servidor.
- Implementar Server Actions cuando correspondan a operaciones reales de servidor.
- Priorizar accesibilidad, rendimiento, responsive design y buenas prácticas de TypeScript.
- Evitar complejidad innecesaria y dependencias redundantes.

## 2. Reglas obligatorias antes de modificar el proyecto

Antes de escribir código:

1. Inspecciona la estructura existente del repositorio.
2. Revisa `package.json`, `tsconfig.json`, `next.config.*`, la configuración de Tailwind, `app/layout.tsx`, `app/globals.css` y los componentes existentes.
3. Identifica las versiones realmente instaladas. No asumas que las APIs de versiones anteriores siguen siendo válidas.
4. Consulta las instrucciones de los archivos `AGENTS.md` que estén en los directorios relevantes.
5. Utiliza el MCP de HeroUI para consultar documentación y ejemplos compatibles con la versión instalada.
6. Identifica los componentes existentes que pueden reutilizarse antes de crear otros.
7. Define un plan breve de implementación antes de realizar cambios estructurales.

No reescribas todo el proyecto si puedes conseguir el resultado mediante cambios localizados y coherentes.

## 3. Stack tecnológico y restricciones

### Stack principal

- Next.js 16 con App Router.
- React y React Server Components.
- TypeScript con tipado estricto.
- Tailwind CSS 4.
- HeroUI como biblioteca principal de componentes de interfaz.
- MCP de HeroUI para consultar documentación, APIs, componentes y patrones de implementación.
- `hugeicons` para iconografía.
- shadcn/ui únicamente cuando exista un componente útil ya integrado que no tenga sentido reemplazar, o cuando se justifique claramente su uso conjunto.
- Vercel Analytics, respetando la configuración existente.

### Restricciones

- No migrar a otro framework.
- No utilizar Pages Router.
- No migrar Tailwind CSS 4 a Tailwind CSS 3.
- No introducir otra biblioteca de componentes sin justificación.
- No duplicar componentes que ya ofrece HeroUI.
- No incorporar librerías para resolver problemas que puedan solucionarse con las herramientas existentes.
- No instalar dependencias sin comprobar primero si son necesarias.
- No reemplazar configuraciones funcionales por configuraciones genéricas.
- No modificar archivos de infraestructura o despliegue sin necesidad.

**HeroUI será la opción predeterminada para nuevos componentes de interfaz.** No mezcles arbitrariamente HeroUI, shadcn/ui y elementos HTML personalizados cuando una única solución consistente sea suficiente.

## 4. Uso obligatorio del MCP de HeroUI

Antes de implementar componentes de HeroUI, utiliza el MCP conectado al proyecto para consultar su documentación.

### Flujo de trabajo

1. Consulta el catálogo de componentes y la documentación del componente que necesitas.
2. Verifica sus imports, props, variantes, composición, accesibilidad y comportamiento.
3. Comprueba si el componente requiere configuración adicional o un provider.
4. Revisa los ejemplos oficiales antes de implementar patrones complejos.
5. Adapta el componente a los tokens visuales y convenciones del proyecto.
6. Verifica que los ejemplos sean compatibles con la versión instalada de HeroUI.
7. Ejecuta las comprobaciones del proyecto después de implementar los cambios.

Si el MCP proporciona herramientas de búsqueda de documentación, úsala para localizar información concreta. Si permite consultar ejemplos, úsalos como referencia; no copies código de forma indiscriminada.

No inventes props, imports, hooks ni APIs de HeroUI.

Si el MCP no está disponible o no devuelve información suficiente, revisa la documentación oficial y las dependencias instaladas antes de continuar. No afirmes haber consultado el MCP si no se utilizó realmente.

### Criterios de uso

- Utiliza HeroUI para los componentes interactivos que cubra adecuadamente.
- Mantén consistencia en botones, campos, diálogos, menús, tarjetas y controles.
- Crea componentes propios cuando representen conceptos específicos del congreso o composiciones que no existan como componente de biblioteca.
- No envuelvas innecesariamente cada componente de HeroUI en múltiples capas.
- Evita abstraer componentes que solo se usan una vez si la abstracción no aporta claridad.
- No introduzcas un sistema paralelo de estilos para replicar funcionalidades ya cubiertas por HeroUI.

## 5. Arquitectura de Next.js

Utiliza el App Router con una arquitectura modular basada en funcionalidades y responsabilidades.

La estructura debe ser suficientemente organizada para permitir la incorporación futura de autenticación, registros, acreditaciones, contenido multimedia y operaciones administrativas sin tener que rehacer el proyecto.

### Estructura de referencia

Adapta esta estructura a los archivos existentes. No crees directorios vacíos ni módulos sin una necesidad real.

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── error.tsx
│   ├── not-found.tsx
│   └── (public)/
│       └── ...
│
├── components/
│   ├── layout/
│   │   ├── site-header.tsx
│   │   ├── site-footer.tsx
│   │   └── mobile-navigation.tsx
│   ├── sections/
│   │   ├── hero-section.tsx
│   │   ├── about-section.tsx
│   │   ├── agenda-section.tsx
│   │   ├── capabilities-section.tsx
│   │   ├── gallery-section.tsx
│   │   └── accreditation-section.tsx
│   └── ui/
│       └── ...
│
├── features/
│   ├── agenda/
│   │   ├── components/
│   │   ├── data/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── actions/
│   │   └── types/
│   ├── accreditation/
│   │   ├── components/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── actions/
│   │   └── types/
│   └── media/
│       ├── components/
│       ├── data/
│       └── types/
│
├── lib/
│   ├── utils.ts
│   ├── constants.ts
│   └── validations/
│
├── server/
│   ├── services/
│   └── repositories/
│
└── types/
```

### Responsabilidad de cada capa

**`app/`**

- Define rutas, layouts, metadata, estados de error y composición de páginas.
- Debe contener la composición principal de cada ruta, no toda la lógica del negocio.
- Mantén los layouts compartidos en el nivel más adecuado.
- No conviertas todos los archivos en componentes cliente.

**`components/layout/`**

- Contiene navegación, cabecera, pie de página y elementos estructurales reutilizables.

**`components/sections/`**

- Contiene las secciones visuales de páginas públicas.
- Compone componentes de dominio y componentes UI.
- No debe convertirse en un lugar para concentrar lógica de servidor.

**`components/ui/`**

- Contiene componentes de interfaz compartidos que envuelven o complementan HeroUI cuando exista un beneficio concreto.
- No dupliques la biblioteca completa de HeroUI.

**`features/`**

- Organiza funcionalidades por dominio.
- Contiene componentes específicos, tipos, esquemas de validación, servicios y Server Actions de cada funcionalidad.
- Evita que una funcionalidad dependa directamente de detalles internos de otra.

**`lib/`**

- Contiene utilidades genéricas, constantes y herramientas transversales.
- No uses este directorio como un depósito indiscriminado de cualquier función.

**`server/`**

- Contiene lógica exclusivamente del servidor que deba reutilizarse entre distintas funcionalidades.
- Puede incluir servicios, acceso a datos y repositorios cuando exista una fuente real de datos.
- Los módulos de esta capa deben protegerse de importaciones accidentales desde componentes cliente.

**`types/`**

- Contiene tipos compartidos entre dominios únicamente cuando exista una necesidad real.
- Prefiere tipos locales a cada funcionalidad si no se comparten.

Si el proyecto actual no utiliza `src/`, no muevas todos los archivos automáticamente. Conserva la convención existente o realiza una migración controlada, consistente y justificada.

## 6. Separación de responsabilidades

La interfaz no debe contener toda la lógica de la aplicación.

Separa explícitamente las siguientes responsabilidades:

1. **Presentación:** renderizado, composición, estilos y accesibilidad.
2. **Interacción local:** apertura de menús, modales, pestañas y estados temporales.
3. **Validación:** esquemas y reglas de validación de entradas.
4. **Lógica de negocio:** políticas y reglas independientes de la interfaz.
5. **Servicios:** coordinación de operaciones de negocio.
6. **Persistencia e integraciones:** acceso a fuentes reales de datos o servicios externos.
7. **Server Actions:** punto de entrada para mutaciones invocadas desde la interfaz.

### Reglas

- Evita componentes monolíticos que mezclen interfaz, validación, peticiones, transformaciones de datos y reglas de negocio.
- No introduzcas hooks personalizados para cada fragmento de estado trivial.
- Extrae funciones puras cuando una transformación o regla pueda probarse independientemente.
- Utiliza servicios cuando haya lógica reutilizable o coordinación real de operaciones.
- No crees clases, interfaces o capas adicionales por cumplir artificialmente con un patrón arquitectónico.
- Evita archivos con responsabilidades ambiguas y nombres genéricos como `helpers.ts`, `manager.ts` o `common.ts` cuando un nombre de dominio sea más claro.
- Prefiere composición antes que componentes con decenas de props condicionales.
- Mantén las dependencias dirigidas hacia módulos estables y evita ciclos de importación.
- No hagas que los componentes visuales conozcan detalles de bases de datos, almacenamiento, autenticación o infraestructura.

La arquitectura debe ser limpia y pragmática: la claridad y la facilidad de mantenimiento son más importantes que la cantidad de carpetas.

## 7. Server Components y Client Components

Utiliza React Server Components por defecto.

### Server Components

Son la opción preferida para:

- Páginas y layouts.
- Secciones informativas del congreso.
- Renderizado de contenido estático.
- Recuperación de datos en el servidor cuando exista una fuente real.
- Composición de componentes de HeroUI que no necesiten interactividad del navegador.

### Client Components

Usa `"use client"` únicamente cuando el componente requiera capacidades del cliente, como:

- Estado local e interacciones mediante hooks.
- Eventos del navegador.
- APIs del navegador.
- Componentes que dependan explícitamente de un entorno cliente.
- Interacciones que no puedan implementarse apropiadamente desde el servidor.

### Reglas

- Coloca `"use client"` en el límite más pequeño posible.
- No conviertas una página completa en Client Component por tener un botón interactivo.
- Aísla la interactividad en componentes pequeños.
- Pasa a los componentes cliente únicamente los datos serializables que necesiten.
- No pases funciones arbitrarias desde Server Components a Client Components.
- No importes módulos de servidor desde componentes cliente.
- Evita efectos de hidratación que puedan resolverse mediante renderizado del servidor.
- No uses `useEffect` para reproducir lógica que puede ejecutarse directamente en el servidor o calcularse durante el renderizado.

## 8. Server Actions y mutaciones

Utiliza Server Actions para operaciones que realmente deban ejecutarse en el servidor y sean invocadas desde la interfaz.

No implementes Server Actions por obligación en todos los componentes o formularios. Su uso debe corresponder a una operación de negocio real.

### Casos apropiados

- Envío de formularios que deban validarse en el servidor.
- Registro de asistentes cuando exista una persistencia configurada.
- Solicitudes de acreditación cuando exista un flujo de procesamiento definido.
- Actualización de datos.
- Operaciones de administración.
- Integraciones con almacenamiento, servicios externos o bases de datos.
- Mutaciones que necesiten autorización y validación del lado del servidor.

### Ubicación

Las acciones específicas de una funcionalidad deben vivir cerca de esa funcionalidad, por ejemplo:

```text
src/features/accreditation/
├── actions/
│   └── submit-accreditation.ts
├── schemas/
│   └── accreditation.schema.ts
├── services/
│   └── accreditation.service.ts
├── components/
│   └── accreditation-form.tsx
└── types/
    └── accreditation.types.ts
```

### Convenciones

- Utiliza `"use server"` en archivos o funciones que deban exponer Server Actions, según el patrón admitido por Next.js 16.
- Mantén las acciones pequeñas y orientadas a casos de uso.
- Valida todas las entradas en el servidor, incluso si ya existe validación en el cliente.
- Utiliza esquemas de validación, como Zod si ya está instalado o si su incorporación está justificada.
- Comprueba la autenticación y autorización en cada operación protegida.
- No confíes en campos ocultos, valores enviados por el cliente ni controles visuales como mecanismo de seguridad.
- Devuelve resultados serializables y predecibles.
- Define una estrategia coherente para errores, mensajes de validación y estados de carga.
- Utiliza `revalidatePath` o `revalidateTag` cuando corresponda y según las APIs de la versión instalada.
- Evita devolver información sensible, credenciales, errores internos o detalles de infraestructura.
- No expongas secretos ni variables privadas en módulos compartidos con el cliente.
- No utilices Server Actions para sustituir innecesariamente operaciones de lectura que pueden realizarse directamente en un Server Component.
- No utilices Server Actions para abrir menús, cambiar pestañas o controlar interacciones puramente visuales.

### Flujo recomendado

```text
Formulario / interacción
        ↓
Server Action
        ↓
Validación de entrada
        ↓
Autorización, cuando aplique
        ↓
Servicio de negocio
        ↓
Repositorio o integración real
        ↓
Resultado serializable
        ↓
Actualización de la interfaz
```

Cada capa solo debe existir cuando la complejidad de la operación lo justifique. Para una operación sencilla no añadas servicios y repositorios vacíos.

### Estado actual del proyecto

El alcance inicial es principalmente frontend.

Por tanto:

- No inventes una base de datos.
- No agregues una API o backend completo sin que se solicite.
- No simules que un registro, una acreditación o una carga de archivos fue guardada realmente.
- No crees Server Actions ficticias que devuelvan éxito sin ejecutar la operación.
- Si todavía no existe persistencia o integración, implementa la interfaz y sus estados de forma honesta, y documenta qué dependencia falta.
- No conectes formularios a un servicio externo sin autorización y configuración explícitas.

## 9. Formularios y validación

Los formularios deben separar la experiencia de usuario de las reglas que se validan en el servidor.

- Utiliza componentes de formulario de HeroUI cuando sean apropiados para la versión instalada.
- Define esquemas de entrada reutilizables cuando existan reglas de validación reales.
- Muestra errores claros, asociados a cada campo.
- Utiliza atributos semánticos y estados accesibles.
- Conserva los valores cuando ocurra un error recuperable, siempre que sea seguro.
- Proporciona estados de envío, éxito y error.
- Evita doble envío accidental.
- No dependas exclusivamente de la validación HTML o de JavaScript en el cliente.
- No solicites información personal innecesaria.
- No afirmes que un registro quedó confirmado si no se completó la operación real.

Si se incorpora un formulario de acreditación al sitio público, debe distinguir claramente entre una maqueta visual y un flujo de registro operativo.

## 10. Diseño visual y sistema de identidad

### Dirección visual

El diseño debe transmitir la identidad de un congreso internacional especializado en seguridad y cooperación policial.

Palabras clave:

- Institucional.
- Estratégico.
- Sobrio.
- Contemporáneo.
- Editorial.
- Cinematográfico.
- Internacional.
- Técnico.
- Profesional.

Evita la apariencia de dashboard administrativo genérico, plantilla SaaS, página de videojuego o sitio policial saturado de elementos decorativos.

Usa estos valores como referencia del sistema visual y adapta su integración a los tokens y mecanismos de tema que realmente utilice la versión instalada de HeroUI.

- El verde oliva debe funcionar como acento institucional.
- Los tonos arena deben aportar calidez editorial.
- El dorado debe utilizarse con moderación para destacar elementos importantes.
- Los fondos deben mantener suficiente profundidad y contraste.
- Evita degradados decorativos innecesarios.
- No conviertas todos los elementos en tarjetas con bordes redondeados.

### Tipografía

Respeta las variables tipográficas existentes:

- `--font-inter` para texto general.
- `--font-display` para titulares editoriales.
- `--font-mono-family` para metadatos, etiquetas técnicas y detalles puntuales.

No instales fuentes adicionales sin necesidad ni elimines estas variables sin una razón concreta.

### Imágenes y recursos

- Prioriza recursos oficiales del congreso.
- Utiliza imágenes con tratamiento editorial y composición coherente.
- Aplica overlays únicamente cuando mejoren la legibilidad.
- Mantén proporciones y recortes consistentes.
- Evita imágenes genéricas que no representen el contexto policial internacional.
- No introduzcas imágenes o emblemas oficiales inventados.
- No alteres información institucional para mejorar la composición visual.

Recurso de identidad disponible:

`https://hebbkx1anhila5yf.public.blob.vercel-storage.com/banner-cipse-xv-ij80P1JKO6LGGG8kXH47Z0yq6mVIL3.png`

Antes de sustituir un recurso, verifica si ya existe una versión local o un recurso más apropiado en el proyecto.

## 11. Contenido y composición de la página

Conserva el contenido institucional y organiza la experiencia con jerarquía visual clara.

Secciones esperadas, de acuerdo con el contenido existente:

1. Hero principal.
2. Identidad del evento y datos destacados.
3. Acerca del congreso.
4. Agenda y sesiones.
5. Capacidades y cooperación.
6. Galería.
7. Programa multimedia, cuando corresponda.
8. Acreditación o llamada a la acción.
9. Footer institucional.

### Reglas de composición

- El hero debe comunicar inmediatamente el nombre, la relevancia y la identidad del congreso.
- Las cifras destacadas deben ser legibles y no competir entre sí.
- La agenda debe permitir localizar rápidamente sesiones y horarios.
- Las galerías deben priorizar la imagen y mantener una composición equilibrada.
- Los elementos interactivos deben ser evidentes sin abusar de animaciones.
- La navegación debe ser consistente y funcionar correctamente en dispositivos móviles.
- El footer debe cerrar la experiencia con información institucional coherente.

No inventes ponentes, instituciones participantes, sedes, fechas, estadísticas, resultados ni horarios. Si falta información, conserva los datos confirmados o utiliza un marcador claramente identificado como pendiente.

## 12. Convenciones de código TypeScript

- Mantén `strict` habilitado cuando la configuración del proyecto lo permita.
- Evita `any`; utiliza tipos explícitos y `unknown` cuando corresponda.
- No dupliques definiciones de tipos.
- Prefiere `type` o `interface` según la necesidad concreta y la convención del repositorio.
- Usa nombres descriptivos y consistentes.
- Prefiere funciones pequeñas con responsabilidades claras.
- Extrae constantes que representen contenido estático significativo.
- Evita cálculos, filtros y transformaciones complejas directamente en JSX.
- Evita condicionales anidados excesivos.
- No uses `as` para ocultar errores de tipado.
- No agregues comentarios que repitan literalmente el código.
- Documenta decisiones no obvias, restricciones y reglas de negocio importantes.

### Datos estáticos

Para la agenda, estadísticas, navegación y contenido editorial:

- Separa los datos de su presentación cuando esto mejore la legibilidad.
- Define tipos adecuados.
- Mantén los datos en el dominio al que pertenecen.
- No construyas una infraestructura de datos compleja para contenido que solo necesita un arreglo tipado.
- No introduzcas una base de datos para gestionar información estática sin una necesidad real.

## 13. Convenciones de componentes

- Usa nombres descriptivos en PascalCase para componentes React.
- Utiliza nombres de archivo consistentes con las convenciones del proyecto.
- Prefiere componentes pequeños y enfocados.
- Evita componentes gigantes que mezclen toda la página.
- Extrae secciones cuando tengan identidad visual o funcional propia.
- Evita componentes excesivamente genéricos que requieren numerosas props para funcionar.
- Usa composición para permitir variaciones sin añadir demasiados booleanos.
- Mantén la lógica específica del dominio cerca de su funcionalidad.
- No crees componentes para cada `div` o fragmento de JSX.
- No abstraigas hasta que exista una necesidad real de reutilización o separación.

## 14. Tailwind CSS y estilos globales

Respeta la configuración existente de Tailwind CSS 4.

Conserva las importaciones necesarias y las convenciones actuales, incluyendo las integraciones existentes de `tw-animate-css` y shadcn/ui mientras sigan siendo necesarias.

Mantén las variables tipográficas y las reglas globales útiles del proyecto, incluyendo:

- `box-sizing`.
- Desplazamiento suave, respetando `prefers-reduced-motion`.
- Estilo de selección de texto.
- Animaciones existentes que realmente se utilicen.
- Estilos base coherentes con el tema oscuro.

Actualiza el fondo global gris `#D1D1D1` a un fondo oscuro coherente con la identidad visual, si todavía está presente.

### Reglas de estilos

- Prioriza las clases utilitarias de Tailwind para la composición de componentes.
- Utiliza tokens de tema para mantener consistencia.
- Evita estilos inline cuando las clases o variantes existentes sean suficientes.
- No dupliques reglas globales por cada componente.
- No agregues selectores globales que afecten accidentalmente a HeroUI.
- Evita `!important` salvo que exista una razón técnica demostrable.
- No crees otro sistema de diseño paralelo.
- Evita valores arbitrarios repetidos cuando deban ser tokens compartidos.
- No alteres el sistema de tema de HeroUI sin verificar primero la documentación de su versión.

## 15. Responsive design

La página debe funcionar correctamente en:

- Móviles de 360–390 px.
- Tablets de aproximadamente 768 px.
- Escritorios de 1280 px.
- Pantallas amplias de 1440 px o más.

### Reglas

- Diseña desde móvil y amplía progresivamente.
- Evita desbordamientos horizontales.
- Asegura que la navegación sea operable con teclado y táctil.
- Ajusta tamaños tipográficos de forma progresiva.
- No reduzcas simplemente toda la interfaz de escritorio para obtener la versión móvil.
- Evita alturas rígidas en secciones que contienen contenido variable.
- Comprueba que las imágenes, la agenda y los formularios mantengan su legibilidad.
- Respeta las áreas seguras y el espacio disponible en dispositivos pequeños.

## 16. Accesibilidad

- Utiliza HTML semántico.
- Mantén una jerarquía correcta de encabezados.
- Proporciona textos alternativos relevantes para imágenes informativas.
- Usa `alt=""` en imágenes puramente decorativas.
- Asegura contraste suficiente entre texto y fondo.
- Mantén indicadores de foco visibles.
- No dependas únicamente del color para comunicar estados.
- Proporciona etiquetas accesibles a botones e iconos.
- Utiliza los mecanismos de accesibilidad incorporados en HeroUI.
- Asegura que diálogos, menús y navegación sean operables con teclado.
- Respeta `prefers-reduced-motion`.
- Evita animaciones que dificulten la lectura o distraigan innecesariamente.

## 17. Rendimiento y seguridad

### Rendimiento

- Prioriza Server Components para contenido que no requiera interactividad.
- Optimiza imágenes mediante las herramientas de Next.js cuando corresponda.
- Utiliza carga diferida para recursos no esenciales.
- Evita dependencias pesadas para efectos menores.
- No añadas animaciones que afecten la fluidez o la legibilidad.
- Evita actualizaciones de estado innecesarias.
- Mantén los bundles cliente pequeños.
- Revisa las dependencias antes de añadir librerías.

### Seguridad

- Nunca expongas secretos en el código del cliente.
- No uses variables `NEXT_PUBLIC_*` para información confidencial.
- No confíes en validaciones exclusivamente del cliente.
- Valida los datos en el servidor antes de procesarlos.
- Comprueba permisos para operaciones protegidas.
- No permitas que el cliente determine arbitrariamente qué recursos puede modificar.
- Si se incorpora almacenamiento en OCI, utiliza credenciales exclusivamente del servidor y permisos mínimos.
- No implementes cargas directas a buckets públicos si la política de acceso requiere almacenamiento privado.
- No añadas autenticación ficticia ni controles de acceso puramente visuales.

## 18. Metadata y configuración del layout

Conserva el layout raíz existente y modifica únicamente lo necesario.

- Mantén la configuración de Analytics en producción.
- Conserva los iconos existentes salvo que haya una sustitución confirmada.
- Mantén el idioma español mediante `lang="es"`.
- Actualiza el título y la descripción para reflejar la identidad oficial del CIPSE XV.
- Mantén una configuración coherente con el tema oscuro.
- Actualiza `themeColor` cuando corresponda al nuevo fondo.
- No elimines configuraciones de metadata, viewport o layout sin justificarlo.
- Evita cargar providers innecesarios.
- Añade el provider de HeroUI solamente si lo requiere la configuración instalada y ubícalo en el nivel apropiado.

## 19. Errores y estados de interfaz

Cuando exista interacción, diseña estados explícitos para:

- Carga.
- Éxito.
- Error recuperable.
- Ausencia de resultados.
- Validación.
- Contenido no disponible.

Utiliza los mecanismos de Next.js y HeroUI que correspondan a la versión instalada.

No muestres errores internos al usuario. No simules cargas o resultados que puedan interpretarse como operaciones reales ya completadas.

Para funcionalidades que todavía no tienen backend, deja claro qué acciones son demostrativas y cuáles están operativas.

## 20. Calidad y validación

Después de implementar cambios relevantes:

1. Ejecuta el linter disponible en el proyecto.
2. Ejecuta la comprobación de tipos.
3. Ejecuta el build de producción cuando sea viable.
4. Revisa errores de compilación y advertencias relevantes.
5. Verifica que los imports de HeroUI correspondan a la versión instalada.
6. Comprueba el comportamiento responsive.
7. Revisa accesibilidad y estados interactivos.
8. Verifica que las rutas existentes sigan funcionando.
9. Comprueba que no se hayan introducido dependencias innecesarias.
10. Revisa el diff para detectar cambios accidentales en configuraciones.

Utiliza los scripts reales de `package.json`; no inventes comandos. No declares una validación como exitosa si no se ejecutó.

## 21. Forma de trabajo de OpenCode

Trabaja de forma incremental y con criterio de ingeniería.

### Antes de implementar

- Inspecciona el código relacionado.
- Consulta el MCP de HeroUI cuando el cambio involucre sus componentes.
- Identifica las responsabilidades afectadas.
- Determina si la solución necesita un Server Component, Client Component, Server Action o una función pura.
- Reutiliza los patrones ya establecidos cuando sean correctos.

### Durante la implementación

- Realiza cambios enfocados.
- Mantén una separación clara entre interfaz y lógica.
- Evita reescribir archivos no relacionados.
- No añadas capas arquitectónicas sin una razón concreta.
- No reemplaces contenido institucional confirmado.
- No introduzcas servicios ficticios para completar una interfaz.
- No ocultes problemas de tipado con conversiones inseguras.

### Al finalizar

Resume:

- Qué se implementó.
- Qué archivos importantes cambiaron.
- Qué componentes de HeroUI se utilizaron y, cuando corresponda, qué documentación se consultó.
- Cómo se separaron las responsabilidades.
- Qué Server Actions se incorporaron y qué operaciones reales ejecutan.
- Qué validaciones se ejecutaron.
- Qué limitaciones o dependencias siguen pendientes.

## 22. Criterios de aceptación

Una implementación se considera aceptable cuando:

- Mantiene la identidad visual institucional del CIPSE XV.
- Es coherente con el sistema de diseño y los componentes de HeroUI.
- Respeta Next.js 16, App Router y Tailwind CSS 4.
- Utiliza el MCP de HeroUI como fuente de referencia para sus APIs y patrones.
- Mantiene Server Components por defecto.
- Aísla la interactividad en Client Components pequeños.
- Separa presentación, validación y lógica de negocio según la complejidad real.
- Implementa Server Actions para mutaciones reales que necesitan ejecutarse en el servidor.
- Valida los datos en el servidor y protege las operaciones sensibles.
- No finge persistencia, autenticación ni integraciones que no existen.
- Es responsive y accesible.
- No introduce dependencias ni abstracciones innecesarias.
- Conserva las configuraciones existentes que siguen siendo válidas.
- Supera las comprobaciones aplicables del proyecto o documenta los errores preexistentes que impiden completarlas.

## Principio rector

**Diseña con intención, estructura con criterio y programa con responsabilidad.**

HeroUI debe acelerar la construcción de una interfaz consistente; Next.js debe proporcionar una separación clara entre servidor y cliente; y la arquitectura debe facilitar el crecimiento del proyecto sin convertir una web institucional en un sistema innecesariamente complejo.
