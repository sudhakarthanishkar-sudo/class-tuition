import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  /** Optional page-level heading rendered above the page content. */
  title?: string;
  subtitle?: string;
}

/**
 * Shared shell: a warm paper app bar, the peach page field, and the
 * attribution footer. Pages render only their own content inside `children`.
 */
export function Layout({ children, title, subtitle }: LayoutProps) {
  const year = new Date().getFullYear();
  const { clear, isAuthenticated } = useInternetIdentity();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 shadow-subtle backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold leading-tight text-foreground">
              Hello Thanishkar
            </p>
            <p className="truncate text-xs font-medium text-muted-foreground">
              Class Tuition Attendance
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isAuthenticated ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => clear()}
                data-ocid="nav.logout_button"
                className="rounded-full text-muted-foreground transition-smooth hover:text-foreground"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            ) : null}
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-primary font-display text-base font-extrabold text-primary-foreground shadow-subtle"
            >
              T
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4">
        {title ? (
          <div className="mb-4">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>

      <footer className="border-t border-border bg-secondary/60 px-4 py-5">
        <p className="mx-auto max-w-2xl text-center text-xs text-muted-foreground">
          © {year}. Built with love using{" "}
          <a
            className="font-semibold text-primary underline-offset-4 hover:underline"
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
