import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type AttendanceError = {
    __kind__: "subjectNotFound";
    subjectNotFound: SubjectId;
} | {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "notFound";
    notFound: AttendanceId;
} | {
    __kind__: "invalidDate";
    invalidDate: null;
};
export type AttendanceId = bigint;
export interface AttendanceView {
    id: AttendanceId;
    status: AttendanceStatus;
    date: DateKey;
    updatedAt: bigint;
    subjectId: SubjectId;
}
export interface Cell {
    value: Value;
    name: string;
}
export type ColourHex = string;
export type DateKey = string;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Result = {
    __kind__: "ok";
    ok: AttendanceView;
} | {
    __kind__: "err";
    err: AttendanceError;
};
export type Result_1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type SubjectError = {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "notFound";
    notFound: SubjectId;
} | {
    __kind__: "invalidName";
    invalidName: null;
} | {
    __kind__: "invalidColour";
    invalidColour: null;
};
export type SubjectId = bigint;
export interface SubjectView {
    id: SubjectId;
    name: string;
    createdAt: bigint;
    colour: ColourHex;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum AttendanceStatus {
    present = "present",
    absent = "absent",
    classCancelled = "classCancelled"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a subject owned by the signed-in caller.
     */
    createSubject(name: string, colour: ColourHex): Promise<SubjectView>;
    /**
     * / Delete one of the signed-in caller's attendance records.
     */
    deleteAttendance(id: AttendanceId): Promise<AttendanceError | null>;
    /**
     * / Delete one of the signed-in caller's subjects.
     */
    deleteSubject(id: SubjectId): Promise<SubjectError | null>;
    /**
     * / Delete a subject and every attendance record that belongs to it.
     */
    deleteSubjectWithAttendance(id: SubjectId): Promise<SubjectError | null>;
    execute(qJson: string): Promise<Result__1>;
    /**
     * / Static Markdown description of this canister's public API.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the signed-in caller's attendance records for a subject.
     */
    listAttendance(subjectId: SubjectId): Promise<Array<AttendanceView>>;
    /**
     * / List the signed-in caller's subjects.
     */
    listSubjects(): Promise<Array<SubjectView>>;
    /**
     * / Record or update attendance for one of the signed-in caller's subjects.
     */
    recordAttendance(subjectId: SubjectId, date: DateKey, status: AttendanceStatus): Promise<Result>;
    schema(): Promise<string>;
}
