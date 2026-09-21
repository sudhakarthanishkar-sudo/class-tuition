import { createActor } from "@/backend";
import type { AttendanceStatus, SubjectView } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const subjectsQueryKey = ["subjects"] as const;

export function attendanceQueryKey(subjectId: bigint) {
  return ["attendance", subjectId.toString()] as const;
}

/** The signed-in caller's subjects. */
export function useSubjects() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: subjectsQueryKey,
    queryFn: async (): Promise<SubjectView[]> => {
      if (!actor) return [];
      return actor.listSubjects();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Attendance records for one subject. */
export function useAttendance(subjectId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: attendanceQueryKey(subjectId ?? 0n),
    queryFn: async () => {
      if (!actor || subjectId === null) return [];
      return actor.listAttendance(subjectId);
    },
    enabled: !!actor && !isFetching && subjectId !== null,
  });
}

/**
 * Totals across every subject the signed-in caller owns: how many attendance
 * records are marked in total, and how many distinct subjects those records
 * come from. Derived on the frontend by fanning the existing per-subject
 * attendance query out across all subjects, so no extra backend method is
 * needed and the shared React Query cache is reused.
 */
export function useAttendanceSummary() {
  const subjectsQuery = useSubjects();
  const subjects = subjectsQuery.data ?? [];
  const { actor, isFetching } = useActor(createActor);

  const attendanceQueries = useQueries({
    queries: subjects.map((subject) => ({
      queryKey: attendanceQueryKey(subject.id),
      queryFn: async () => {
        if (!actor) return [];
        return actor.listAttendance(subject.id);
      },
      enabled: !!actor && !isFetching,
    })),
  });

  const isLoading =
    subjectsQuery.isLoading ||
    attendanceQueries.some((query) => query.isLoading);

  let totalClasses = 0;
  let subjectsWithRecords = 0;
  for (const query of attendanceQueries) {
    const count = query.data?.length ?? 0;
    totalClasses += count;
    if (count > 0) subjectsWithRecords += 1;
  }

  return { totalClasses, subjectsWithRecords, isLoading };
}

export function useCreateSubject() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; colour: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createSubject(input.name, input.colour);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsQueryKey });
    },
  });
}

/** Delete a subject together with every attendance record it owns. */
export function useDeleteSubject() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteSubjectWithAttendance(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsQueryKey });
    },
  });
}

/** Record or update attendance for a subject on a given date. */
export function useRecordAttendance() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      subjectId: bigint;
      date: string;
      status: AttendanceStatus;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.recordAttendance(input.subjectId, input.date, input.status);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: attendanceQueryKey(variables.subjectId),
      });
    },
  });
}

export function useDeleteAttendance() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: bigint; subjectId: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteAttendance(input.id);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: attendanceQueryKey(variables.subjectId),
      });
    },
  });
}
