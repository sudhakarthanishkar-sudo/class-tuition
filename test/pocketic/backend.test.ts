import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import type {
  AttendanceView,
  Result,
  _SERVICE,
} from "../../src/frontend/src/declarations/backend.did";
import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";

/** Narrow the `recordAttendance` result to its success payload. */
function unwrapOk(result: Result): AttendanceView {
  if (!("ok" in result)) {
    throw new Error(`expected an ok result, got ${JSON.stringify(result)}`);
  }
  return result.ok;
}

/**
 * The real canister, installed into the platform's PocketIC replica. The
 * frontend suite mocks the actor, so it would pass unchanged against a backend
 * whose public methods are all `Debug.todo()` stubs; this lane is what proves
 * the compiled wasm answers its own public API.
 *
 * Shapes come from `declarations/`, not the `@/backend` wrapper: PocketIC builds
 * its actor from `idlFactory` directly, so Candid maps `Nat` to `bigint`, `?T`
 * to `[] | [T]`, and a variant to `{ variantName: null }`.
 */
const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far; a failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.listSubjects()).resolves.toEqual([]);
});

it("round-trips a subject through the real canister", async () => {
  const created = await actor.createSubject("Mathematics", "#E4572E");
  expect(created).toMatchObject({ name: "Mathematics", colour: "#E4572E" });

  const subjects = await actor.listSubjects();
  expect(subjects).toContainEqual(
    expect.objectContaining({ id: created.id, name: "Mathematics" }),
  );
});

it("records and lists attendance for a subject", async () => {
  const subject = await actor.createSubject("Physics", "#7C4DFF");

  const recorded = await actor.recordAttendance(subject.id, "2026-09-18", {
    present: null,
  });
  expect(recorded).toHaveProperty("ok");

  const records = await actor.listAttendance(subject.id);
  expect(records).toContainEqual(
    expect.objectContaining({ subjectId: subject.id, date: "2026-09-18" }),
  );
});

it("updates the status of an already-recorded date", async () => {
  const subject = await actor.createSubject("Chemistry", "#2F9E8F");
  await actor.recordAttendance(subject.id, "2026-09-17", { present: null });

  const updated = await actor.recordAttendance(subject.id, "2026-09-17", {
    classCancelled: null,
  });
  expect(updated).toHaveProperty("ok");

  const records = await actor.listAttendance(subject.id);
  const forDate = records.filter((record) => record.date === "2026-09-17");
  expect(forDate).toHaveLength(1);
  expect(forDate[0]?.status).toEqual({ classCancelled: null });
});

it("deletes a subject together with its attendance records", async () => {
  const subject = await actor.createSubject("Biology", "#F4A261");
  await actor.recordAttendance(subject.id, "2026-09-16", { absent: null });

  await expect(
    actor.deleteSubjectWithAttendance(subject.id),
  ).resolves.toEqual([]);

  const subjects = await actor.listSubjects();
  expect(subjects.map((item) => item.id)).not.toContain(subject.id);
  await expect(actor.listAttendance(subject.id)).resolves.toEqual([]);
});

it("deletes a single attendance record", async () => {
  const subject = await actor.createSubject("History", "#E76F51");
  const recorded = await actor.recordAttendance(subject.id, "2026-09-15", {
    present: null,
  });
  const recordId = unwrapOk(recorded).id;

  await expect(actor.deleteAttendance(recordId)).resolves.toEqual([]);
  await expect(actor.listAttendance(subject.id)).resolves.toEqual([]);
});

it("scopes subjects and attendance to the calling principal", async () => {
  // Its own canister, so the subjects the other tests created under the
  // default sender cannot be mistaken for a caller-isolation failure.
  const { actor: isolated } = await pic!.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  });

  const alice = Principal.fromUint8Array(
    new Uint8Array([...new Array(28).fill(0), 1]),
  );
  const bob = Principal.fromUint8Array(
    new Uint8Array([...new Array(28).fill(0), 2]),
  );

  isolated.setPrincipal(alice);
  const aliceSubject = await isolated.createSubject("Alice Maths", "#E4572E");
  await isolated.recordAttendance(aliceSubject.id, "2026-09-14", {
    present: null,
  });

  isolated.setPrincipal(bob);
  // Bob sees none of Alice's data, and cannot read her subject's attendance.
  await expect(isolated.listSubjects()).resolves.toEqual([]);
  await expect(isolated.listAttendance(aliceSubject.id)).resolves.toEqual([]);
  // Recording against a subject Bob does not own is rejected, not silently
  // written into Alice's records.
  const rejected = await isolated.recordAttendance(
    aliceSubject.id,
    "2026-09-14",
    { present: null },
  );
  expect(rejected).toHaveProperty("err");

  isolated.setPrincipal(alice);
  const aliceSubjects = await isolated.listSubjects();
  expect(aliceSubjects.map((item) => item.id)).toContain(aliceSubject.id);
});
