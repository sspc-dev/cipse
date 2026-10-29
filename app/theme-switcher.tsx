"use client";

import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore, type SVGProps } from "react";

/*
 * next-themes resolves the persisted/system theme only on the client, so the
 * selector renders after hydration with useSyncExternalStore instead of an
 * effect (setState-in-effect trips the compiler lint rule).
 */
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  "aria-hidden": "true",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2z" />
    </svg>
  );
}

export function SystemIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect height="11" rx="2" width="18" x="3" y="4" />
      <path d="M8 19h8M12 15v4" />
    </svg>
  );
}

type ThemeOption = "light" | "dark" | "system";

const themeOptions: {
  icon: (props: IconProps) => React.JSX.Element;
  id: ThemeOption;
  label: string;
}[] = [
  { icon: SunIcon, id: "light", label: "Modo claro" },
  { icon: MoonIcon, id: "dark", label: "Modo oscuro" },
  { icon: SystemIcon, id: "system", label: "Según el sistema" },
];

const THEME_KEYS = new Set<string>(["light", "dark", "system"]);

const groupClass =
  "rounded-full border border-border bg-surface/80 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40";

const toggleClass =
  "size-8 rounded-full text-foreground/70 transition-colors hover:text-foreground data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent-soft-foreground";

export function ThemeSwitcher() {
  const mounted = useMounted();
  const { setTheme, theme } = useTheme();

  if (!mounted) return null;

  const activeTheme: ThemeOption = THEME_KEYS.has(theme ?? "")
    ? (theme as ThemeOption)
    : "system";

  return (
    <div className="fixed right-4 top-4 z-50">
      <ToggleButtonGroup
        aria-label="Selección de tema"
        className={groupClass}
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={new Set([activeTheme])}
        onSelectionChange={(keys) => {
          const next = [...keys][0];
          if (typeof next === "string" && THEME_KEYS.has(next)) {
            setTheme(next);
          }
        }}
      >
        {themeOptions.map(({ icon: Icon, id, label }) => (
          <ToggleButton
            key={id}
            aria-label={label}
            className={toggleClass}
            id={id}
            isIconOnly
          >
            <Icon className="size-4" />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
