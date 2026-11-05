"use client";

import { type Dictionary } from "@/lib/i18n";
import { type MediaViewItem } from "../taxonomy";
import Image from "next/image";

type FeaturedMediaCardProps = {
  item: MediaViewItem | null;
  copy: Dictionary["media"];
};

export function FeaturedMediaCard({ copy }: FeaturedMediaCardProps) {
  return (
    <Image
      alt={copy.featuredLogoAlt}
      className="aspect-16/11 w-full  transition-transform duration-700 group-hover:scale-[1.03]"
      src="/imgs/XV CIPSE logos_vv1.svg"
      width={120}
      height={120}
      priority
    />
  );
}
