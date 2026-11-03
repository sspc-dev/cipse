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
  constructor() {
    super(
      "El almacenamiento de multimedia (OCI Object Storage) no está configurado.",
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
    privateKey: (process.env.OCI_PRIVATE_KEY as string).replace(/\\n/g, "\n"),
    passphrase: process.env.OCI_PRIVATE_KEY_PASSPHRASE ?? null,
  };
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
      config.privateKey,
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

export type MediaObjectStream = {
  stream: ReadableStream<Uint8Array>;
  contentLength: number;
  contentRange: Range;
};

function parseRangeHeader(value: string | null): Range | null {
  if (!value) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return null;

  const start = match[1] ? Number(match[1]) : null;
  const end = match[2] ? Number(match[2]) : null;

  if (start === null && end === null) return null;
  return new Range(start, end, null);
}

export async function getMediaObject(input: {
  key: string;
  rangeHeader?: string | null;
}): Promise<MediaObjectStream> {
  const config = requireConfig();
  const client = getClient(config);
  const range = parseRangeHeader(input.rangeHeader ?? null);

  const response = await client.getObject({
    namespaceName: config.namespace,
    bucketName: config.bucket,
    objectName: input.key,
    range: range ?? undefined,
  });

  const value = response.value;
  const stream =
    value instanceof Readable
      ? (Readable.toWeb(value) as ReadableStream<Uint8Array>)
      : (value as ReadableStream<Uint8Array>);

  return {
    stream,
    contentLength: response.contentLength,
    contentRange: response.contentRange,
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
