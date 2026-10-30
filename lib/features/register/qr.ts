/**
 * Generación server-side del PNG de la credencial QR.
 * Server-only: nunca importar desde componentes cliente.
 */
import { toBuffer } from "qrcode";
import { CREDENTIAL_QR_OPTIONS, credentialCheckinUrl } from "./credential";

const PNG_WIDTH = 780;

export async function generateCredentialQrPng(
  accessCode: string,
  origin: string,
): Promise<Buffer> {
  return await toBuffer(credentialCheckinUrl(accessCode, origin), {
    ...CREDENTIAL_QR_OPTIONS,
    type: "png",
    width: PNG_WIDTH,
  });
}
