import { Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AddSubjectDialog } from "@/components/AddSubjectDialog";
import { SubjectCard } from "@/components/SubjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

const SKELETON_IDS = Array.from(
  { length: 3 },
  (_, i) => `subject-skeleton-${i}`,
);

export function HomePage() {
  const { data: subjects, isLoading, isError, refetch } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const list = useMemo<Subject[]>(
    () =>
      (subjects ?? []).map((subject) => ({
        id: subject.id,
        name: subject.name,
        colour: subject.colour,
        createdAt: subject.createdAt,
      })),
    [subjects],
  );

  const handleCreate = (input: { name: string; colour: string }) => {
    setFormError(null);
    createSubject.mutate(input, {
      onSuccess: (created) => {
        setDialogOpen(false);
        toast.success(`${created.name} added`);
      },
      onError: () => {
        setFormError("Could not add that subject. Please try again.");
      },
    });
  };

  const handleDelete = (subject: Subject) => {
    deleteSubject.mutate(subject.id, {
      onSuccess: (result) => {
        if (result) {
          toast.error(`Could not delete ${subject.name}`);
          return;
        }
        toast.success(`${subject.name} deleted`);
      },
      onError: () => {
        toast.error(`Could not delete ${subject.name}`);
      },
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-2xl px-5 pb-32 pt-7">
      <section data-ocid="home.section" className="animate-rise">
        <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight text-foreground">
          Hello Thanishkar
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Class Tuition Attendance
        </p>
      </section>

      <section className="mt-7" aria-labelledby="subjects-heading">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2
            id="subjects-heading"
            className="font-display text-lg font-bold text-foreground"
          >
            Your subjects
          </h2>
          {list.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {list.length} {list.length === 1 ? "subject" : "subjects"}
            </span>
          )}
        </div>

        {isLoading && (
          <div
            data-ocid="subjects.loading_state"
            className="flex flex-col gap-3"
          >
            {SKELETON_IDS.map((id) => (
              <Skeleton
                key={id}
                className="h-[74px] rounded-[var(--radius-card)]"
              />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div
            data-ocid="subjects.error_state"
            className="rounded-[var(--radius-card)] border border-border bg-card p-6 text-center shadow-subtle"
          >
            <p className="font-display text-base font-bold text-foreground">
              We couldn't load your subjects
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check your connection and try again.
            </p>
            <Button
              type="button"
              data-ocid="subjects.retry_button"
              onClick={() => void refetch()}
              className="mt-4 h-10 rounded-full bg-gradient-primary px-5 font-semibold"
            >
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && list.length === 0 && (
          <div
            data-ocid="subjects.empty_state"
            className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-10 text-center shadow-subtle"
          >
            <span
              aria-hidden="true"
              className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/20 text-accent"
            >
              <Sparkles className="size-7" />
            </span>
            <p className="mt-4 font-display text-lg font-bold text-foreground">
              No subjects yet
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
              Add your first class to start marking attendance day by day.
            </p>
            <Button
              type="button"
              data-ocid="subjects.empty_add_button"
              onClick={() => setDialogOpen(true)}
              className="mt-5 h-11 rounded-full bg-gradient-primary px-6 font-semibold shadow-float"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add Subjects
            </Button>
          </div>
        )}

        {!isLoading && !isError && list.length > 0 && (
          <ul data-ocid="subjects.list" className="flex flex-col gap-3">
            {list.map((subject, index) => (
              <li key={subject.id.toString()}>
                <SubjectCard
                  subject={subject}
                  index={index}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto flex w-full max-w-2xl justify-end px-5 pb-6">
          <Button
            type="button"
            data-ocid="subjects.open_modal_button"
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
            className={cn(
              "pointer-events-auto h-12 gap-2 rounded-full bg-gradient-primary px-5 font-semibold text-primary-foreground shadow-float",
              "transition-smooth hover:scale-[1.03] active:scale-[0.98]",
            )}
          >
            <Plus className="size-5" aria-hidden="true" />
            Add Subjects
          </Button>
        </div>
      </div>

      <AddSubjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isPending={createSubject.isPending}
        errorMessage={formError}
      />
    </div>
  );
}
