import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { CalendarCheck, Loader2 } from "lucide-react";

/**
 * The only screen an unauthenticated visitor sees. Sign-in goes through
 * Internet Identity via the provider injected by the template.
 */
export default function LoginPage() {
  const { login, isLoggingIn, isInitializing, loginError } =
    useInternetIdentity();

  const busy = isLoggingIn || isInitializing;

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-peach">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <section
          data-ocid="login.card"
          className="animate-rise w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-7 shadow-elevated sm:p-9"
        >
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-float"
          >
            <CalendarCheck className="size-7" />
          </span>

          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground">
            Attendance Book
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Keep a tidy record of every class — mark Present, Absent or Class
            Cancelled, and backfill any day you missed.
          </p>

          <ul className="mt-6 space-y-2.5 text-sm text-foreground">
            {[
              "One tab per subject, in your own colour",
              "Three statuses, marked in a single tap",
              "A small calendar for past dates",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-accent"
                />
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            size="lg"
            onClick={() => login()}
            disabled={busy}
            data-ocid="login.submit_button"
            className="mt-7 w-full rounded-full bg-gradient-primary text-primary-foreground shadow-float transition-smooth hover:opacity-95"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isInitializing ? "Preparing…" : "Signing in…"}
              </>
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>

          {loginError ? (
            <p
              role="alert"
              data-ocid="login.error_state"
              className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              Sign-in did not complete. Please try again.
            </p>
          ) : null}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Your attendance stays private to your Internet Identity.
          </p>
        </section>
      </main>

      <footer className="px-4 pb-6">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-2 transition-smooth hover:text-primary"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
