export const statusLabels: Record<string, string> = {
  PENDING: "Pendiente de revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export function labelStatus(status: string): string {
  return statusLabels[status] ?? status;
}
