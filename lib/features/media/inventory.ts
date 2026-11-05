import type { EventMediaWithKey } from "./datasource";
import type { MediaObjectSummary } from "./storage";

/**
 * Reconciliación entre lo que hay en el bucket OCI y lo que está registrado
 * en `event_media`. Función pura: sin I/O, fácil de probar.
 *
 * - `registered`: registro con su objeto presente en el bucket.
 * - `orphans`: objeto en el bucket sin registro en MySQL.
 * - `broken`: registro cuyo objeto ya no existe en el bucket.
 */

export type RegisteredMediaItem = EventMediaWithKey & {
  bucketObject: MediaObjectSummary;
};

export type MediaInventory = {
  registered: RegisteredMediaItem[];
  orphans: MediaObjectSummary[];
  broken: EventMediaWithKey[];
};

export function reconcileMediaInventory(
  bucketObjects: MediaObjectSummary[],
  registered: EventMediaWithKey[],
): MediaInventory {
  const bucketByName = new Map(
    bucketObjects.map((object) => [object.name, object]),
  );
  const registeredKeys = new Set(
    registered.map((item) => item.objectKey),
  );

  return {
    registered: registered.flatMap((item) => {
      const bucketObject = bucketByName.get(item.objectKey);
      return bucketObject ? [{ ...item, bucketObject }] : [];
    }),
    orphans: bucketObjects.filter(
      (object) => !registeredKeys.has(object.name),
    ),
    broken: registered.filter((item) => !bucketByName.has(item.objectKey)),
  };
}
