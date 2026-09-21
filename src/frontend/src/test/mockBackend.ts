import type { AttendanceStatus, AttendanceView, SubjectView } from "@/backend";
import { AttendanceStatus as Status } from "@/backend";

/**
 * A typed in-memory stand-in for the generated backend actor. It implements the
 * public methods the frontend actually calls, so component tests exercise the
 * real hooks and query wiring against a deterministic local actor rather than a
 * network. It is NOT the canister: the PocketIC lane is what proves the real
 * backend behaves.
 */
export interface MockBackendActor {
  listSubjects(): Promise<SubjectView[]>;
  createSubject(name: string, colour: string): Promise<SubjectView>;
  deleteSubjectWithAttendance(id: bigint): Promise<null>;
  listAttendance(subjectId: bigint): Promise<AttendanceView[]>;
  recordAttendance(
    subjectId: bigint,
    date: string,
    status: AttendanceStatus,
  ): Promise<{ __kind__: "ok"; ok: AttendanceView }>;
  deleteAttendance(id: bigint): Promise<null>;
}

export interface MockBackendState {
  subjects: SubjectView[];
  attendance: AttendanceView[];
  nextSubjectId: bigint;
  nextAttendanceId: bigint;
  calls: {
    createSubject: Array<{ name: string; colour: string }>;
    deleteSubjectWithAttendance: bigint[];
    recordAttendance: Array<{
      subjectId: bigint;
      date: string;
      status: AttendanceStatus;
    }>;
    deleteAttendance: bigint[];
  };
}

export function createMockBackendState(
  seed: Partial<Pick<MockBackendState, "subjects" | "attendance">> = {},
): MockBackendState {
  return {
    subjects: seed.subjects ?? [],
    attendance: seed.attendance ?? [],
    nextSubjectId: BigInt((seed.subjects ?? []).length),
    nextAttendanceId: BigInt((seed.attendance ?? []).length),
    calls: {
      createSubject: [],
      deleteSubjectWithAttendance: [],
      recordAttendance: [],
      deleteAttendance: [],
    },
  };
}

export function createMockBackendActor(
  state: MockBackendState,
): MockBackendActor {
  return {
    async listSubjects() {
      return [...state.subjects];
    },
    async createSubject(name, colour) {
      const subject: SubjectView = {
        id: state.nextSubjectId,
        name,
        colour,
        createdAt: BigInt(Date.now()) * 1_000_000n,
      };
      state.nextSubjectId += 1n;
      state.subjects.push(subject);
      state.calls.createSubject.push({ name, colour });
      return subject;
    },
    async deleteSubjectWithAttendance(id) {
      state.calls.deleteSubjectWithAttendance.push(id);
      state.subjects = state.subjects.filter((subject) => subject.id !== id);
      state.attendance = state.attendance.filter(
        (record) => record.subjectId !== id,
      );
      return null;
    },
    async listAttendance(subjectId) {
      return state.attendance.filter(
        (record) => record.subjectId === subjectId,
      );
    },
    async recordAttendance(subjectId, date, status) {
      state.calls.recordAttendance.push({ subjectId, date, status });
      const existing = state.attendance.find(
        (record) => record.subjectId === subjectId && record.date === date,
      );
      if (existing) {
        existing.status = status;
        existing.updatedAt = BigInt(Date.now()) * 1_000_000n;
        return { __kind__: "ok", ok: existing };
      }
      const record: AttendanceView = {
        id: state.nextAttendanceId,
        subjectId,
        date,
        status,
        updatedAt: BigInt(Date.now()) * 1_000_000n,
      };
      state.nextAttendanceId += 1n;
      state.attendance.push(record);
      return { __kind__: "ok", ok: record };
    },
    async deleteAttendance(id) {
      state.calls.deleteAttendance.push(id);
      state.attendance = state.attendance.filter((record) => record.id !== id);
      return null;
    },
  };
}

export function makeSubject(
  id: bigint,
  name: string,
  colour = "#2F9E8F",
): SubjectView {
  return { id, name, colour, createdAt: BigInt(Date.now()) * 1_000_000n };
}

export function makeAttendance(
  id: bigint,
  subjectId: bigint,
  date: string,
  status: AttendanceStatus = Status.present,
): AttendanceView {
  return {
    id,
    subjectId,
    date,
    status,
    updatedAt: BigInt(Date.now()) * 1_000_000n,
  };
}
