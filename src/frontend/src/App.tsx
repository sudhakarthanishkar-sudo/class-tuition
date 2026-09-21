import { Layout } from "@/components/Layout";
import { useSubjects } from "@/hooks/useQueries";
import { HomePage } from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import { SubjectPage } from "@/pages/SubjectPage";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const subjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subjects/$subjectId",
  component: SubjectRoute,
});

function SubjectRoute() {
  const { subjectId } = subjectRoute.useParams();
  const subjectsQuery = useSubjects();
  const subject = (subjectsQuery.data ?? []).find(
    (item) => item.id.toString() === subjectId,
  );

  if (subjectsQuery.isLoading) {
    return (
      <div
        data-ocid="subject.loading_state"
        className="rounded-[1.375rem] border border-border bg-card p-6 text-center shadow-subtle"
      >
        <p className="text-sm text-muted-foreground">Loading subject…</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div
        data-ocid="subject.not_found_state"
        className="rounded-[1.375rem] border border-border bg-card p-6 text-center shadow-subtle"
      >
        <p className="font-display text-lg font-extrabold text-foreground">
          Subject not found
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted. Head back and pick another subject.
        </p>
      </div>
    );
  }

  return <SubjectPage subject={subject} />;
}

const routeTree = rootRoute.addChildren([homeRoute, subjectRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div
          data-ocid="app.loading_state"
          className="flex flex-col items-center gap-3 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">Opening your attendance book…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <RouterProvider router={router} />;
}
