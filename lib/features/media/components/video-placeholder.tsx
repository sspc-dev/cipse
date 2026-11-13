import { PlayIcon } from "@/components/icons";

/**
 * Miniatura estática para archivos de video en las tarjetas de las galerías.
 * Evita montar <video> (y sus peticiones de metadatos) en cada tarjeta; el
 * video real solo se carga en el visor cuando el usuario lo abre.
 */
export function VideoPlaceholder({
  className = "",
  size = "lg",
}: {
  className?: string;
  size?: "sm" | "lg";
}) {
  const badgeSize = size === "sm" ? "size-8" : "size-11";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <span
      aria-hidden="true"
      className={`relative flex size-full items-center justify-center overflow-hidden bg-[#0b1712] ${className}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(197,155,39,0.16),transparent_62%)]" />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
      <span
        className={`relative flex ${badgeSize} items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110`}
      >
        <PlayIcon className={`ml-0.5 ${iconSize}`} />
      </span>
    </span>
  );
}
