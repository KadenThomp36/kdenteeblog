import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-1">
            <span className="font-display text-2xl tracking-tight text-foreground transition-colors group-hover:text-primary">
              KdenTee
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="hover-line text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            {session && (
              <Link
                href="/admin/posts"
                className="hover-line text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-xs text-muted-foreground hidden md:inline tracking-wide">
                {session.user?.name || session.user?.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-[13px] uppercase tracking-[0.1em] font-medium hover:text-primary"
              >
                Login
              </Button>
            </Link>
          )}
          <div className="w-px h-4 bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
