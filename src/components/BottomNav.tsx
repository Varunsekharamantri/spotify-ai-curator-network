"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, SearchIcon, LibraryIcon, CreateIcon, SparkleIcon } from "./icons";

const TABS = [
  { href: "/home", label: "Home", Icon: HomeIcon, match: "/home" },
  { href: "/search", label: "Search", Icon: SearchIcon, match: "/search" },
  { href: "/", label: "Curator Match", Icon: SparkleIcon, match: "/" },
  { href: "/library", label: "Library", Icon: LibraryIcon, match: "/library" },
  { href: "/create", label: "Create", Icon: CreateIcon, match: "/create" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 items-center justify-around bg-ai-bg px-1 pb-3 pt-2">
      {TABS.map((tab) => {
        const active =
          tab.match === "/" ? pathname === "/" || pathname.startsWith("/curator") : pathname === tab.match;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 text-[9px] font-medium ${
              active ? "text-ai-green" : "text-ai-subtext"
            }`}
          >
            <tab.Icon className="h-[22px] w-[22px]" filled={active} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
