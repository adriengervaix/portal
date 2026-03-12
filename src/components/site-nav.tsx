"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarksNavDropdown } from "@/components/bookmarks/bookmarks-nav-dropdown";

const navItems = [
  { href: "/", label: "Projects" },
  { href: "/clients", label: "Clients" },
  { href: "/admin/fiscale", label: "Admin" },
  { href: "/bookmarks", label: "Bookmarks" },
] as const;

/**
 * Site-wide horizontal navigation bar with logo and text links.
 * Bookmarks is first; when on /bookmarks, folder dropdown appears to the right.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-8 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Home">
          <Logo />
        </Link>
        <div className="flex items-center gap-8">
          {navItems.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <div key={href} className="flex items-center gap-2">
                <Link
                  href={href}
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </Link>
                {href === "/bookmarks" && isActive && (
                  <Suspense fallback={null}>
                    <BookmarksNavDropdown />
                  </Suspense>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/**
 * Abstract geometric logo — squares and diamonds in a circular, gear-like pattern.
 */
function Logo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground shrink-0"
      aria-hidden
    >
      {/* Center diamond */}
      <path d="M14 6L18 14L14 22L10 14L14 6Z" fill="currentColor" />
      {/* Cardinal squares */}
      <rect x="10" y="2" width="8" height="8" fill="currentColor" />
      <rect x="18" y="10" width="8" height="8" fill="currentColor" />
      <rect x="10" y="18" width="8" height="8" fill="currentColor" />
      <rect x="2" y="10" width="8" height="8" fill="currentColor" />
    </svg>
  );
}
