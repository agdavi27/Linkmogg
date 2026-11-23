"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "Overview"], ["/admin/prospects", "Prospects"], ["/admin/prospects/import", "Import & add"],
  ["/admin/dm-queue", "DM queue"], ["/admin/settings", "Settings"],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Admin">
      {ITEMS.map(([href, label]) => {
        const on = path === href;
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${on ? "bg-ink text-paper" : "text-ink-2 hover:bg-black/5 hover:text-ink"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
