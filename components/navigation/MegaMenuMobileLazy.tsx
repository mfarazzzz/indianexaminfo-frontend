"use client";

import dynamic from "next/dynamic";
import type { NavigationTree, QuickAccessItem } from "@/types/navigation";

const MegaMenuMobile = dynamic(
  () => import("./MegaMenuMobile").then((mod) => ({ default: mod.MegaMenuMobile })),
  { ssr: false }
);

interface Props {
  pillars: NavigationTree[];
  quickAccessItems: QuickAccessItem[];
  onClose: () => void;
}

export function MegaMenuMobileLazy(props: Props) {
  return <MegaMenuMobile {...props} />;
}
