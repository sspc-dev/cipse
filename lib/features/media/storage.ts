import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve as resolvePath } from "node:path";
import { Readable } from "node:stream";
import { ObjectStorageClient } from "oci-objectstorage";
import { Range, Region, SimpleAuthenticationDetailsProvider } from "oci-common";

/**
 * Acceso a OCI Object Storage (server-only). La configuración se lee del
 * entorno en cada llamada para poder desplegar sin recompilar. Si falta
 * alguna credencial, las operaciones fallan con un error explícito en lugar
 * de simular una subida exitosa.
 */

const REQUIRED_ENV = [
  "OCI_REGION",
  "OCI_NAMESPACE",
  "OCI_BUCKET",
  "OCI_TENANCY",
  "OCI_USER",
  "OCI_FINGERPRINT",
  "OCI_PRIVATE_KEY",
] as const;

export class MediaStorageNotConfiguredError extends Error {
  constructor(detail?: string) {
    super(
      detail
        ? `El almacenamiento de multimedia (OCI Object Storage) no está configurado: ${detail}`
        : "El almacenamiento de multimedia (OCI Object Storage) no está configurado.",
    );
    this.name = "MediaStorageNotConfiguredError";
  }
}

type StorageConfig = {
  regionId: string;
  namespace: string;
  bucket: string;
  tenancy: string;
  user: string;
  fingerprint: string;
  privateKey: string;
  passphrase: string | null;
};

function readConfig(): StorageConfig | null {
  if (REQUIRED_ENV.some((name) => !process.env[name])) {
    return null;
  }

  return {
    regionId: process.env.OCI_REGION as string,
    namespace: process.env.OCI_NAMESPACE as string,
    bucket: process.env.OCI_BUCKET as string,
    tenancy: process.env.OCI_TENANCY as string,
    user: process.env.OCI_USER as string,
    fingerprint: process.env.OCI_FINGERPRINT as string,
    // Valor crudo de OCI_PRIVATE_KEY: ruta de archivo o PEM en una línea.
    // La resolución ocurre en getClient, al crear el cliente.
    privateKey: process.env.OCI_PRIVATE_KEY as string,
    passphrase: process.env.OCI_PRIVATE_KEY_PASSPHRASE ?? null,
  };
}

/**
 * OCI_PRIVATE_KEY admite dos formatos:
 * - Ruta de archivo (`~/.oci/clave.pem`, `/run/secrets/oci/key.pem`): se lee
 *   el contenido del archivo en el momento de crear el cliente.
 * - PEM en una sola línea con "\n" escapados.
 */
function resolvePrivateKey(value: string): string {
  const isPath =
    value.startsWith("~") || isAbsolute(value) || value.startsWith("./");

  if (isPath) {
    const filePath = value.startsWith("~/")
      ? resolvePath(homedir(), value.slice(2))
      : resolvePath(value);

    try {
      return readFileSync(filePath, "utf8");
    } catch {
      throw new MediaStorageNotConfiguredError(
        `no se pudo leer la clave privada en ${filePath}.`,
      );
    }
  }

  return value.replace(/\\n/g, "\n");
}

export function isMediaStorageConfigured(): boolean {
  return readConfig() !== null;
}

export function missingMediaStorageEnv(): string[] {
  return REQUIRED_ENV.filter((name) => !process.env[name]);
}

function requireConfig(): StorageConfig {
  const config = readConfig();
  if (!config) throw new MediaStorageNotConfiguredError();
  return config;
}

let cachedClient: ObjectStorageClient | null = null;
let cachedRegionId: string | null = null;

function getClient(config: StorageConfig): ObjectStorageClient {
  if (!cachedClient || cachedRegionId !== config.regionId) {
    const provider = new SimpleAuthenticationDetailsProvider(
      config.tenancy,
      config.user,
      config.fingerprint,
      resolvePrivateKey(config.privateKey),
      config.passphrase,
      Region.fromRegionId(config.regionId),
    );

    cachedClient = new ObjectStorageClient({
      authenticationDetailsProvider: provider,
    });
    cachedRegionId = config.regionId;
  }

  return cachedClient;
}

export async function uploadMediaObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const config = requireConfig();
  const client = getClient(config);

  await client.putObject({
    namespaceName: config.namespace,
    bucketName: config.bucket,
    objectName: input.key,
    putObjectBody: input.body,
    contentLength: input.body.byteLength,
    contentType: input.contentType,
  });
}

export type MediaObjectSummary = {
  name: string;
  sizeBytes: number;
  createdAt: Date;
};

/** Tope de páginas por consulta (1000 objetos por página → 10 000 objetos). */
const MAX_LIST_PAGES = 10;

/**
 * Lista los objetos del bucket con paginación OCI (`start`/`nextStartWith`).
 * `fields` es obligatorio para que la respuesta incluya tamaño y fecha:
 * por defecto solo se devuelve el nombre.
 */
export async function listBucketObjects(
  prefix?: string,
): Promise<MediaObjectSummary[]> {
  const config = requireConfig();
  const client = getClient(config);

  const objects: MediaObjectSummary[] = [];
  let start: string | undefined;
  let pages = 0;

  do {
    const response = await client.listObjects({
      namespaceName: config.namespace,
      bucketName: config.bucket,
      prefix,
      start,
      limit: 1000,
      fields: "name,size,timeCreated",
    });

    const page = response.listObjects;
    objects.push(
      ...page.objects.map((object) => ({
        name: object.name,
        sizeBytes: object.size ?? 0,
        // El SDK declara `Date` pero en runtime devuelve string ISO.
        createdAt: new Date(object.timeCreated ?? 0),
      })),
    );

    start = page.nextStartWith;
    pages += 1;
  } while (start && pages < MAX_LIST_PAGES);

  return objects;
}

/**
 * Rango real de una respuesta 206.
 *
 * El SDK declara `GetObjectResponse.contentRange: Range` pero en runtime
 * nunca lo llena (ni siquiera con peticiones por rango), así que los
 * offsets se calculan aquí a partir del rango solicitado y de la longitud
 * devuelta. `totalBytes` solo es determinable vía headObject.
 */
export type MediaRangeInfo = {
  startByte: number;
  endByte: number;
  totalBytes: number | null;
};

export type MediaObjectStream = {
  stream: ReadableStream<Uint8Array>;
  contentLength: number;
  /** null = respuesta completa (200). */
  contentRange: MediaRangeInfo | null;
};

type ParsedRange =
  | { kind: "sliced"; startByte: number; endByte: number | null }
  | { kind: "suffix"; length: number };

function parseRangeHeader(value: string | null): ParsedRange | null {
  if (!value) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return null;

  const start = match[1] ? Number(match[1]) : null;
  const end = match[2] ? Number(match[2]) : null;

  if (start === null && end === null) return null;
  if (start === null) return { kind: "suffix", length: end ?? 0 };
  return { kind: "sliced", startByte: start, endByte: end };
}

async function readObjectTotalBytes(
  client: ObjectStorageClient,
  config: StorageConfig,
  key: string,
): Promise<number | null> {
  try {
    const head = await client.headObject({
      namespaceName: config.namespace,
      bucketName: config.bucket,
      objectName: key,
    });
    return head.contentLength;
  } catch {
    return null;
  }
}

export async function getMediaObject(input: {
  key: string;
  rangeHeader?: string | null;
}): Promise<MediaObjectStream> {
  const config = requireConfig();
  const client = getClient(config);
  const parsed = parseRangeHeader(input.rangeHeader ?? null);

  let requestRange: Range | undefined;
  let rangeStart: number | null = null;
  let totalBytes: number | null = null;

  if (parsed?.kind === "sliced" && parsed.endByte !== null) {
    // Rango cerrado (`bytes=S-E`): OCI lo devuelve directo.
    rangeStart = parsed.startByte;
    requestRange = new Range(parsed.startByte, parsed.endByte, null);
  } else if (parsed?.kind === "sliced") {
    // `bytes=S-`: el SDK serializa endByte null como la cadena "null" y OCI
    // responde 416. Se resuelve el total con headObject y se pide un rango
    // cerrado equivalente.
    const total = await readObjectTotalBytes(client, config, input.key);
    if (total !== null && parsed.startByte < total) {
      totalBytes = total;
      rangeStart = parsed.startByte;
      requestRange = new Range(parsed.startByte, total - 1, null);
    }
    // Sin total (o rango insatisfacible) → respuesta completa 200.
  } else if (parsed?.kind === "suffix") {
    // `bytes=-N` necesita el total para calcular el byte inicial.
    const total = await readObjectTotalBytes(client, config, input.key);
    if (total !== null) {
      totalBytes = total;
      rangeStart = Math.max(0, total - parsed.length);
      requestRange = new Range(rangeStart, total - 1, null);
    }
  }

  const response = await client.getObject({
    namespaceName: config.namespace,
    bucketName: config.bucket,
    objectName: input.key,
    range: requestRange,
  });

  const value = response.value;
  const stream =
    value instanceof Readable
      ? (Readable.toWeb(value) as ReadableStream<Uint8Array>)
      : (value as ReadableStream<Uint8Array>);

  const received = response.contentLength ?? 0;

  return {
    stream,
    contentLength: received,
    contentRange:
      rangeStart !== null
        ? {
            startByte: rangeStart,
            endByte: rangeStart + received - 1,
            totalBytes,
          }
        : null,
  };
}

export async function deleteMediaObject(key: string): Promise<void> {
  const config = requireConfig();
  const client = getClient(config);

  await client.deleteObject({
    namespaceName: config.namespace,
    bucketName: config.bucket,
    objectName: key,
  });
}

export function isObjectNotFoundError(error: unknown): boolean {
  return (error as { statusCode?: number } | null)?.statusCode === 404;
}
