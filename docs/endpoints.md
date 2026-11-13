# Endpoints de CIPSE XV — Documento de auditoría

Documentación orientada a **auditoría de seguridad y análisis de IDOR** de la superficie de servidor del proyecto: rutas HTTP (App Router Route Handlers) y Server Actions.

- **Framework:** Next.js 16 (App Router).
- **Autenticación:** sesión de administrador/acreditador mediante cookie `cipse_admin_session` (HTTP-only, `SameSite=Lax`, `secure` solo en producción, TTL 8 h). El token se guarda hasheado en base de datos.
- **Modelo de autorización:** rol único de administrador. No existen roles ni scoping por propietario: cualquier sesión admin puede operar sobre cualquier recurso.
- **Convención de respuestas:** las rutas HTTP devuelven `Response`/`Response.json`; las Server Actions devuelven objetos serializables `{ ok: true, ... }` / `{ ok: false, ... }`.

> **Nota para el auditor:** las Server Actions no exponen códigos HTTP propios. Se documentan con una **columna "código equivalente"** que traduce su resultado tipado a la semántica HTTP para facilitar la comparación con las rutas. Esos códigos **no se emiten realmente**: Next.js responde `200` a la invocación de la acción y el resultado viaja en el cuerpo serializado.
>
> Las secciones marcadas como **Observación** recogen riesgos potenciales a verificar durante la sesión, no vulnerabilidades confirmadas.

## Índice

- [Resumen de auditoría](#resumen-de-auditoría)
- [Rutas HTTP](#rutas-http)
  - [`POST /api/media/upload`](#post-apimediaupload)
  - [`GET /api/media/object`](#get-apimediaobject)
  - [`GET /api/reports/attendance`](#get-apireportsattendance)
  - [`GET /multimedia/file/[id]`](#get-multimediafileid)
- [Server Actions](#server-actions)
  - [Autenticación](#autenticación)
  - [Registro / acreditación](#registro--acreditación)
  - [Check-in](#check-in)
  - [Multimedia](#multimedia)
  - [Usuarios administradores](#usuarios-administradores)
- [Análisis IDOR y enumeración de identificadores](#análisis-idor-y-enumeración-de-identificadores)
- [Observaciones de riesgo](#observaciones-de-riesgo)
- [Checklist de auditoría](#checklist-de-auditoría)

---

## Resumen de auditoría

| Tipo | Endpoint | Método | Auth | Identificador controlado por usuario | Respuestas | Riesgo IDOR |
| --- | --- | --- | --- | --- | --- | --- |
| HTTP | `/api/media/upload` | POST | Admin | `day`, `title`, `file` (nombre/MIME) | 201, 400, 401, 413, 415, 500, 502, 503 | Bajo |
| HTTP | `/api/media/object` | GET | Admin | `name` (query) | 200, 206, 400, 401, 404, 502, 503 | Bajo (regex estricta) |
| HTTP | `/api/reports/attendance` | GET | Admin | `day` (query) | 200, 400, 401, 502 | Bajo (PII, admin-only) |
| HTTP | `/multimedia/file/[id]` | GET | **Público** | `id` (path, numérico) | 200, 206, 404, 502, 503 | **Medio-Alto (enumerable)** |
| Action | `loginAdmin` | POST (acción) | Público | `email`, `password` | 200, 400, 401, 429, 503 (equiv.) | N/A |
| Action | `getAdminSession` | POST (acción) | — | cookie de sesión | 200 / sin sesión (equiv.) | N/A |
| Action | `logoutAdmin` | POST (acción) | Admin | cookie de sesión | 200 / sin sesión (equiv.) | N/A |
| Action | `registerAccreditation` | POST (acción) | **Público** | datos del formulario, `email` | 200, 400, 409, 500 (equiv.) | N/A (creación) |
| Action | `registerAttendance` | POST (acción) | Admin | `accessCode` | 200, 400, 401, 500 (equiv.) | Bajo (código 16–64 alnum) |
| Action | `lookupAccreditation` | POST (acción) | Admin | `accessCode` | 200, 400, 401, 500 (equiv.) | Bajo (código 16–64 alnum) |
| Action | `deleteEventMediaAction` | POST (acción) | Admin | `id` | 200, 400, 401, 404, 500, 503 (equiv.) | Bajo (sin ownership) |
| Action | `updateEventMediaAction` | POST (acción) | Admin | `id`, `day`, `title` | 200, 400, 401, 404, 500 (equiv.) | Bajo (sin ownership) |
| Action | `createAdminUser` | POST (acción) | Admin | `name`, `email`, `password` | 200, 400, 401, 409, 500 (equiv.) | N/A (creación) |
| Action | `updateAdminUserAction` | POST (acción) | Admin | `id`, `name`, `email` | 200, 400, 401, 409, 500 (equiv.) | Bajo (sin ownership) |
| Action | `setAdminUserActiveAction` | POST (acción) | Admin | `id`, `active` | 200, 400, 401, 500 (equiv.) | Bajo (autoprotección) |
| Action | `resetAdminUserPasswordAction` | POST (acción) | Admin | `id`, `password` | 200, 400, 401, 500 (equiv.) | **Medio** (sin ownership) |

---

## Rutas HTTP

### `POST /api/media/upload`

Sube un archivo multimedia a Oracle Cloud (OCI Object Storage) y registra sus metadatos en MySQL.

- **Archivo:** `app/api/media/upload/route.ts`
- **Autenticación:** requerida (`getAdminSession`) — se evalúa **antes** de leer el formulario. Sin sesión → `401`.
- **Content-Type:** `multipart/form-data`.
- **Límite de tamaño:** `MAX_MEDIA_BYTES` = **100 MB** por archivo (`lib/features/media/types.ts`).

#### Entradas y validación

| Campo | Fuente | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- | --- |
| `file` | form-data | `File` | Sí | No vacío; MIME permitido; ≤ 100 MB. |
| `day` | form-data | number | Sí | Entero dentro de `MULTIMEDIA_DAYS` (`1`, `2`, `3`). |
| `title` | form-data | string | No | Deriva del nombre del archivo si falta; 2–160 caracteres tras `trim`. |

**MIME permitidos:** imágenes (`jpeg`, `png`, `webp`, `gif`, `avif`), videos (`mp4`, `webm`, `quicktime`), documentos (`pdf`, Word, PowerPoint, Excel, `text/plain`). Otro MIME → `415`.

#### Autorización / IDOR

- Guard admin global; no hay recurso previo que validar (es una creación).
- El nombre del archivo solo se usa para derivar extensión (saneada, máx. 10 alfanuméricos) y título por defecto; la clave del objeto se genera con UUID → **no controlable** por el cliente.
- `createdBy` se toma de la sesión, no del cliente.

#### Respuestas

| Estado | Cuerpo | Cuándo |
| --- | --- | --- |
| `201` | `{ "ok": true, "id": number }` | Archivo subido y registrado. |
| `400` | `{ "ok": false, "message": string }` | Formulario ilegible, archivo ausente/vacío o datos inválidos. |
| `401` | `{ "ok": false, "message": string }` | Sin sesión de administrador. |
| `413` | `{ "ok": false, "message": string }` | Archivo > 100 MB. |
| `415` | `{ "ok": false, "message": string }` | MIME no permitido. |
| `500` | `{ "ok": false, "message": string }` | Falló el registro en BD (rollback best-effort del objeto). |
| `502` | `{ "ok": false, "message": string }` | Error al subir a OCI. |
| `503` | `{ "ok": false, "message": string }` | OCI no configurado. |

---

### `GET /api/media/object`

Vista previa de un objeto del bucket para el inventario del panel admin.

- **Archivo:** `app/api/media/object/route.ts`
- **Autenticación:** requerida (`getAdminSession`). Sin sesión → `401`.

#### Entradas y validación

| Parámetro | Fuente | Obligatorio | Validación |
| --- | --- | --- | --- |
| `name` | query | Sí | Debe cumplir `/^multimedia\/dia-\d+\/[0-9A-Za-z-]{8,}\.[0-9A-Za-z]{1,10}$/`. |

#### Autorización / IDOR

- Guard admin global.
- La regex estricta bloquea prefijos libres, `..` y path traversal → **riesgo bajo**.
- No valida contra la tabla de multimedia: cualquier objeto del bucket que cumpla el patrón es accesible por un admin (alcance intencional del inventario).

#### Respuestas

| Estado | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | Stream del objeto | Servido completo (`inline`). |
| `206` | Stream parcial | Petición con `Range`. |
| `400` | `Objeto no válido.` | `name` ausente o fuera del patrón. |
| `401` | `No autorizado.` | Sin sesión. |
| `404` | `El objeto ya no está disponible.` | Objeto inexistente. |
| `502` | `No fue posible leer el objeto.` | Error inesperado de almacenamiento. |
| `503` | `El almacenamiento de multimedia no está configurado.` | OCI no configurado. |

Cabeceras: `Content-Disposition: inline`, `Cache-Control: private, max-age=3600`, `Accept-Ranges: bytes`.

---

### `GET /api/reports/attendance`

Descarga el reporte **XLSX** de asistencia. Contiene datos personales de delegados (correo y teléfono).

- **Archivo:** `app/api/reports/attendance/route.ts`
- **Autenticación:** requerida (`getAdminSession`). Sin sesión → `401`.

#### Entradas y validación

| Parámetro | Fuente | Obligatorio | Validación |
| --- | --- | --- | --- |
| `day` | query | No | Fecha ISO `YYYY-MM-DD` (`attendanceReportQuerySchema`). Vacío/ausente → consolidado. |

#### Autorización / IDOR

- Guard admin global; no acepta identificadores de recurso más allá del filtro de fecha.
- **Datos sensibles:** exporta PII de delegados; servido con `Cache-Control: no-store` y `attachment`.

#### Respuestas

| Estado | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | Archivo XLSX (`attachment`) | Reporte generado. |
| `400` | `El día solicitado no es válido.` | `day` no es fecha ISO válida. |
| `401` | `No autorizado.` | Sin sesión. |
| `502` | `No fue posible generar el reporte.` | Error al consultar datos o construir el workbook. |

---

### `GET /multimedia/file/[id]`

Sirve o descarga un archivo multimedia por su ID. **Endpoint público** (galería pública).

- **Archivo:** `app/multimedia/file/[id]/route.ts`
- **Autenticación:** **no requerida**.
- **Ruta dinámica:** `id` = entero ≥ 1.

#### Entradas y validación

| Parámetro | Fuente | Validación |
| --- | --- | --- |
| `id` | path | `Number.isInteger(id) && id >= 1`; si no → `404`. |
| `Range` | header | Soportado → `206 Partial Content`. |

#### Autorización / IDOR

- **Sin autenticación ni autorización.** Cualquier visitante puede solicitar cualquier ID.
- El ID es **secuencial** (clave primaria de BD) → **enumerable**.
- La clave del objeto en OCI usa UUID, pero el endpoint resuelve por ID de BD, por lo que el UUID no protege la enumeración.
- `Content-Disposition`: `inline` para imágenes/videos/PDF; `attachment` para el resto de documentos (Office, TXT).
- Ver [Análisis IDOR](#análisis-idor-y-enumeración-de-identificadores).

#### Respuestas

| Estado | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | Stream del archivo | Servido completo. |
| `206` | Stream parcial | Petición con `Range`. |
| `404` | `Archivo no encontrado.` / `El archivo ya no está disponible.` | ID inválido, fila inexistente u objeto eliminado. |
| `502` | `No fue posible leer el archivo.` | Error inesperado de almacenamiento. |
| `503` | `El almacenamiento de multimedia no está configurado.` | OCI no configurado. |

Cabeceras: `Content-Type` según la fila, `Cache-Control: public, max-age=31536000, immutable`, `Accept-Ranges: bytes`.

---

## Server Actions

Se invocan desde componentes cliente y se ejecutan en el servidor. Next.js las expone internamente en la ruta de la página que las usa, por lo que **no son URLs públicas con path propio**. Cada ficha documenta su firma, entradas, autorización, respuestas (con código HTTP equivalente) y efectos secundarios.

### Autenticación

**Archivo:** `lib/features/auth/actions.ts`

#### `loginAdmin` · POST (acción)

Inicia sesión de administrador.

- **Autenticación:** pública (endpoint de login).
- **Firma:** `loginAdmin(input: unknown): Promise<LoginResponse>`.
- **Entrada** (`credentialsSchema`):

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `email` | string | Sí | Email válido, `trim`, máx. 254 caracteres. |
| `password` | string | Sí | Mín. 8, máx. 128 caracteres. |

- **Autorización / IDOR:** no aplica (autenticación). El mensaje de credenciales inválidas no distingue si falló el usuario o la contraseña.
- **Controles:** throttle de 5 intentos/minuto por email (en memoria). Sesión de 8 h.
- **Efectos secundarios:** crea sesión en BD, escribe cookie `cipse_admin_session` (HTTP-only, `SameSite=Lax`, `secure` en producción, TTL 8 h).

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "admin": { "id", "name", "email" } }` | Credenciales válidas y sesión creada. |
| `400` | `{ "ok": false, "message": string }` | Entrada inválida (email/contraseña). |
| `401` | `{ "ok": false, "message": string }` | Credenciales incorrectas. |
| `429` | `{ "ok": false, "message": string }` | Más de 5 intentos en un minuto. |
| `503` | `{ "ok": false, "message": string }` | No se pudo crear la sesión en BD. |

#### `getAdminSession` · POST (acción, uso interno)

Resuelve la sesión activa a partir de la cookie. Es el **guard** que usan las demás acciones y rutas.

- **Autenticación:** N/A (lectura de sesión).
- **Firma:** `getAdminSession(): Promise<AdminSession | null>`.
- **Entrada:** cookie `cipse_admin_session` (se exige token de 64 caracteres; se valida hasheado contra BD).
- **Autorización / IDOR:** no recibe parámetros; no es enumerable.
- **Efectos secundarios:** ninguno.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "id", "name", "email" }` | Sesión válida. |
| `401` | `null` | Cookie ausente, token inválido o sesión expirada. |

#### `logoutAdmin` · POST (acción)

Cierra la sesión activa.

- **Autenticación:** requiere cookie de sesión para revocar el token; sin cookie solo borra el cliente.
- **Firma:** `logoutAdmin(): Promise<void>`.
- **Entrada:** cookie `cipse_admin_session`.
- **Autorización / IDOR:** solo afecta a la propia sesión del llamante.
- **Efectos secundarios:** invalida el token en BD y elimina la cookie.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `void` (sin cuerpo) | Sesión cerrada o cookie eliminada. |

---

### Registro / acreditación

**Archivo:** `lib/features/register/actions.ts`

#### `registerAccreditation` · POST (acción)

Registra una acreditación de delegado y envía la credencial por correo.

- **Autenticación:** **pública** (formulario de registro).
- **Firma:** `registerAccreditation(input: unknown, locale?: string): Promise<RegisterActionResponse>`.
- **Entrada** (`createRegisterSchema`, mensajes según idioma):

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `name` | string | Sí | `trim`, mín. 2. |
| `lastname` | string | Sí | `trim`, mín. 2. |
| `country` | string | Sí | `trim`, mín. 2. |
| `institution` | string | Sí | `trim`, mín. 2. |
| `position` | string | Sí | `trim`, mín. 2. |
| `phone` | string | No | Vacío o `/^[+()\-\s\d]{7,20}$/`. |
| `email` | string | Sí | Email válido; se normaliza a minúsculas. |

- **Autorización / IDOR:** creación; no manipula identificadores de otros recursos.
- **Efectos secundarios:** inserta en `accreditations`, genera folio `CIPSE-<id 4 dígitos>` y `accessCode`, envía correo con QR; si el envío fue `sent`, actualiza `access_email_sent_at`.
- **Observación:** endpoint público de creación sin rate limiting propio.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "id", "accessCode", "email", "emailDelivery" }` | Acreditación creada. |
| `400` | `{ "ok": false, "code": "VALIDATION", "message" }` | Entrada inválida. |
| `409` | `{ "ok": false, "code": "DUPLICATE_EMAIL", "message" }` | El email ya está registrado. |
| `500` | `{ "ok": false, "code": "DB_ERROR", "message" }` | Error de base de datos. |

`emailDelivery` ∈ `{ state: "sent" } | { state: "failed"; reason } | { state: "skipped"; reason }`.

---

### Check-in

**Archivo:** `lib/features/checkin/actions.ts`

> Ambas requieren sesión (`getAdminSession`). El `accessCode` se valida con `accessCodeSchema`: `trim`, 16–64 caracteres, solo `[a-zA-Z0-9]`.

#### `registerAttendance` · POST (acción)

Registra la asistencia del día para un código de acceso.

- **Autenticación:** admin.
- **Firma:** `registerAttendance(accessCode: string, locale?: string): Promise<CheckinActionResponse>`.
- **Entrada:** `accessCode` (`accessCodeSchema`).
- **Autorización / IDOR:** el código de acceso actúa como credencial de recurso (16–64 alfanuméricos); no hay rate limit específico, pero el espacio de búsqueda es amplio.
- **Efectos secundarios:** crea el registro de asistencia del día si no existe (idempotente por día).

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "alreadyToday", "attendedAt", "attendanceDays", "record": { "folio", "name", "lastname", "country" } }` | Asistencia registrada o ya existente. |
| `400` | `{ "ok": false, "code": "INVALID_CODE", "message" }` | Código inválido o inexistente. |
| `401` | `{ "ok": false, "code": "SESSION_REQUIRED", "message" }` | Sin sesión. |
| `500` | `{ "ok": false, "code": "DB_ERROR", "message" }` | Error de base de datos. |

#### `lookupAccreditation` · POST (acción)

Consulta una credencial por código sin registrar asistencia.

- **Autenticación:** admin.
- **Firma:** `lookupAccreditation(accessCode: string): Promise<CheckinActionResponse>`.
- **Entrada:** `accessCode` (`accessCodeSchema`).
- **Autorización / IDOR:** igual que `registerAttendance`; solo lectura.
- **Efectos secundarios:** ninguno.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "alreadyToday": false, "attendedAt", "attendanceDays": 0, "record": { ... } }` | Credencial encontrada. |
| `400` | `{ "ok": false, "code": "INVALID_CODE", "message" }` | Código inválido o inexistente. |
| `401` | `{ "ok": false, "code": "SESSION_REQUIRED", "message" }` | Sin sesión. |
| `500` | `{ "ok": false, "code": "DB_ERROR", "message" }` | Error de base de datos. |

---

### Multimedia

**Archivo:** `lib/features/media/actions.ts`

> Ambas requieren admin y devuelven `MediaActionResult` = `{ ok: true, message } | { ok: false, message }`.

#### `deleteEventMediaAction` · POST (acción)

Elimina un archivo multimedia.

- **Autenticación:** admin.
- **Firma:** `deleteEventMediaAction(input: unknown): Promise<MediaActionResult>`.
- **Entrada:** `mediaIdSchema` — entero positivo.
- **Autorización / IDOR:** no hay ownership check; cualquier admin puede borrar cualquier archivo por `id` (ID secuencial).
- **Efectos secundarios:** elimina el objeto de OCI y luego la fila de BD; `revalidatePath("/dashboard/multimedia")` y `/multimedia`.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "message" }` | Archivo eliminado. |
| `400` | `{ "ok": false, "message" }` | ID inválido. |
| `401` | `{ "ok": false, "message" }` | Sesión expirada. |
| `404` | `{ "ok": false, "message" }` | El archivo ya no existe. |
| `500` | `{ "ok": false, "message" }` | Falló el borrado de objeto o de fila. |
| `503` | `{ "ok": false, "message" }` | OCI no configurado. |

#### `updateEventMediaAction` · POST (acción)

Actualiza día y título de un archivo.

- **Autenticación:** admin.
- **Firma:** `updateEventMediaAction(input: unknown): Promise<MediaActionResult>`.
- **Entrada** (`mediaUpdateSchema`):

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `id` | number | Sí | Entero positivo. |
| `day` | number | Sí | Entero en los días del congreso (`1`–`3`). |
| `title` | string | Sí | `trim`, 2–160 caracteres. |

- **Autorización / IDOR:** no hay ownership check; cualquier admin puede editar cualquier archivo.
- **Efectos secundarios:** actualiza y revalida `/dashboard/multimedia` y `/multimedia`.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "message" }` | Archivo actualizado. |
| `400` | `{ "ok": false, "message" }` | Datos inválidos. |
| `401` | `{ "ok": false, "message" }` | Sesión expirada. |
| `404` | `{ "ok": false, "message" }` | El archivo ya no existe. |
| `500` | `{ "ok": false, "message" }` | Error al actualizar. |

---

### Usuarios administradores

**Archivo:** `lib/features/users/actions.ts`

> Todas requieren admin y devuelven `UserActionResult` = `{ ok: true, message } | { ok: false, message, field?: "name" | "email" | "password" }`.

#### `createAdminUser` · POST (acción)

Crea un usuario administrador.

- **Autenticación:** admin.
- **Firma:** `createAdminUser(input: unknown): Promise<UserActionResult>`.
- **Entrada** (`createAdminUserSchema`):

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `name` | string | Sí | `trim`, 2–120 caracteres. |
| `email` | string | Sí | Email válido, `trim`, máx. 254; minúsculas. |
| `password` | string | Sí | 8–128 caracteres. |

- **Autorización / IDOR:** creación; no aplica ownership.
- **Efectos secundarios:** hashea la contraseña e inserta; `revalidatePath("/dashboard/usuarios")`.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "message" }` | Usuario creado. |
| `400` | `{ "ok": false, "message", "field"? }` | Datos inválidos. |
| `401` | `{ "ok": false, "message" }` | Sesión expirada. |
| `409` | `{ "ok": false, "field": "email", "message" }` | Email duplicado. |
| `500` | `{ "ok": false, "message" }` | Error de base de datos. |

#### `updateAdminUserAction` · POST (acción)

Actualiza nombre y email de un usuario.

- **Autenticación:** admin.
- **Firma:** `updateAdminUserAction(input: unknown): Promise<UserActionResult>`.
- **Entrada** (`updateAdminUserSchema`): `id` (entero positivo), `name` (`trim`, 2–120), `email` (email válido, máx. 254, minúsculas).
- **Autorización / IDOR:** cualquier admin puede modificar la cuenta de otro admin (sin ownership).
- **Efectos secundarios:** actualiza y revalida `/dashboard/usuarios`.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "message" }` | Usuario actualizado. |
| `400` | `{ "ok": false, "message", "field"? }` | Datos inválidos. |
| `401` | `{ "ok": false, "message" }` | Sesión expirada. |
| `409` | `{ "ok": false, "field": "email", "message" }` | Email duplicado. |
| `500` | `{ "ok": false, "message" }` | Error de base de datos. |

#### `setAdminUserActiveAction` · POST (acción)

Activa o desactiva un usuario administrador.

- **Autenticación:** admin.
- **Firma:** `setAdminUserActiveAction(input: unknown): Promise<UserActionResult>`.
- **Entrada** (`setAdminUserActiveSchema`): `id` (entero positivo), `active` (boolean).
- **Autorización / IDOR:** cualquier admin puede cambiar el estado de otra cuenta, salvo **desactivarse a sí mismo** (`id === session.id` y `active === false`).
- **Efectos secundarios:** al desactivar, las sesiones del usuario dejan de ser válidas.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "message" }` | Estado cambiado. |
| `400` | `{ "ok": false, "message" }` | Solicitud no válida o intento de autodesactivación. |
| `401` | `{ "ok": false, "message" }` | Sesión expirada. |
| `500` | `{ "ok": false, "message" }` | Error al cambiar estado. |

#### `resetAdminUserPasswordAction` · POST (acción)

Restablece la contraseña de un usuario administrador.

- **Autenticación:** admin.
- **Firma:** `resetAdminUserPasswordAction(input: unknown): Promise<UserActionResult>`.
- **Entrada** (`resetAdminUserPasswordSchema`): `id` (entero positivo), `password` (8–128).
- **Autorización / IDOR:** cualquier admin puede resetear la contraseña de **otra** cuenta admin, sin verificación de la contraseña actual ni confirmación de la cuenta objetivo, y sin jerarquía de roles. **Verificar como hallazgo medio.**
- **Efectos secundarios:** hashea y guarda la nueva contraseña; `revalidatePath("/dashboard/usuarios")`.

| Código equiv. | Cuerpo | Cuándo |
| --- | --- | --- |
| `200` | `{ "ok": true, "message" }` | Contraseña actualizada. |
| `400` | `{ "ok": false, "field": "password", "message" }` | Contraseña inválida. |
| `401` | `{ "ok": false, "message" }` | Sesión expirada. |
| `500` | `{ "ok": false, "message" }` | Error al actualizar la contraseña. |

---

## Análisis IDOR y enumeración de identificadores

| Identificador | Superficie | Control de acceso | Enumerable | Evaluación |
| --- | --- | --- | --- | --- |
| `id` (media) | `GET /multimedia/file/[id]` | **Ninguno (público)** | **Sí** (secuencial) | **Medio-Alto**: permite recorrer y descargar todo el material, incluidos documentos Office/TXT servidos como `attachment`. |
| `name` (objeto) | `GET /api/media/object` | Admin | No (UUID + regex) | Bajo: regex impide traversal y prefijos libres. |
| `day` | `/api/reports/attendance`, actions media | Admin | N/A | Bajo: filtro acotado por esquema. |
| `accessCode` | `registerAttendance`, `lookupAccreditation` | Admin | Difícil (16–64 alnum) | Bajo: sin rate limit específico, pero espacio de búsqueda amplio. |
| `id` (usuario) | `updateAdminUserAction`, `setAdminUserActiveAction`, `resetAdminUserPasswordAction` | Admin | Sí (secuencial) | **Medio** en reset de contraseña: no hay ownership ni jerarquía; un admin puede tomar control de otra cuenta. |
| `id` (media) | `deleteEventMediaAction`, `updateEventMediaAction` | Admin | Sí (secuencial) | Bajo: rol único, operación administrativa esperada. |

### Consideraciones clave para IDOR

1. **`/multimedia/file/[id]` es el principal candidato IDOR/enumeración.** Es público, usa un ID secuencial y no aplica rate limiting. Aunque la galería pública es intencional, cualquier documento cargado (contratos, listas, PDFs internos) queda accesible por enumeración. Recomendación a verificar: exponer solo medios públicos, usar identificadores no secuenciales (UUID público) o exigir autenticación para documentos.
2. **No existe scoping por propietario en ninguna superficie.** El modelo es "un solo rol admin global". Cualquier sesión admin puede leer/editar/borrar cualquier recurso y gestionar cualquier cuenta. Confirmar que esto es una decisión de diseño aceptada.
3. **`resetAdminUserPasswordAction`** permite a cualquier admin cambiar la contraseña de otro admin sin verificación adicional (ni contraseña actual, ni confirmación de la cuenta objetivo). Candidato a hallazgo medio.
4. **Las claves de objeto en OCI (UUID)** no se exponen en las respuestas de creación (`{ ok, id }`), lo que reduce la filtración de claves de almacenamiento.

---

## Observaciones de riesgo

> Riesgos potenciales a validar en la sesión de auditoría; no confirmados.

- **Throttle de login en memoria:** `loginAdmin` limita a 5 intentos/minuto por email con un `Map` en proceso. Se reinicia al reiniciar el proceso y no se comparte entre instancias → en despliegue multi-instancia el límite es evadible. Verificar.
- **Un único rol admin:** no hay separación de privilegios; cualquier admin gestiona usuarios, multimedia y reportes con PII. Verificar si se requiere mínimo privilegio.
- **Reset de contraseña sin verificación del objetivo:** ver análisis IDOR (punto 3).
- **CSRF:** cookie `SameSite=Lax`; las Server Actions de Next.js incluyen verificación de origen. Confirmar el comportamiento en producción y con proxies.
- **Cookies:** `secure` solo en producción; `HttpOnly` presente. Verificar configuración TLS en el despliegue.
- **Rollback best-effort en upload:** si falla el registro en BD, la eliminación del objeto en OCI puede fallar y dejar objetos huérfanos (impacto operativo, no de confidencialidad).
- **Mensajes de error:** las rutas HTTP devuelven mensajes genéricos; `loginAdmin` no distingue usuario/contraseña (buena práctica). Verificar que no haya fugas en logs (`console.error`) con datos sensibles.
- **Reporte de asistencia:** contiene correo y teléfono; `no-store` y admin-only. Verificar control de acceso y ausencia de caché en CDN/proxy.
- **Validación de entrada:** toda entrada pasa por Zod en servidor; revisar que ningún campo se use sin parsear en consultas (posible inyección SQL en datasources).
- **Subida de archivos:** se valida MIME declarado por el cliente, no el contenido real (magic bytes). Verificar si un archivo con MIME falsificado podría almacenarse y servirse.

---

## Checklist de auditoría

| # | Elemento a verificar | Resultado | Evidencia / notas |
| --- | --- | --- | --- |
| 1 | Enumeración de `GET /multimedia/file/[id]` (IDs secuenciales, sin auth) | ☐ | |
| 2 | Acceso a documentos (Office/TXT) vía enumeración | ☐ | |
| 3 | Rate limiting en `loginAdmin` (multi-instancia / reinicio) | ☐ | |
| 4 | `resetAdminUserPasswordAction` sobre otra cuenta admin | ☐ | |
| 5 | Escalada horizontal/vertical entre admins | ☐ | |
| 6 | Path traversal en `/api/media/object` (`name`) | ☐ | |
| 7 | Validación de MIME por contenido vs. declarado en upload | ☐ | |
| 8 | Inyección SQL en datasources (filtros `q`, `country`, `day`, `id`) | ☐ | |
| 9 | Fuga de PII en reporte de asistencia (caché, logs) | ☐ | |
| 10 | CSRF / verificación de origen en Server Actions | ☐ | |
| 11 | Atributos de cookie de sesión (`Secure`, `HttpOnly`, `SameSite`) | ☐ | |
| 12 | Manejo de sesión expirada / revocación en acciones | ☐ | |
| 13 | Exposición de claves de objeto OCI en respuestas | ☐ | |
| 14 | Objetos huérfanos por fallo de rollback en upload | ☐ | |
| 15 | Mensajes de error y logging sin datos sensibles | ☐ | |
