import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/attendance";
import SubjectTypes "../types/subjects";
import AttendanceLib "../lib/attendance";

mixin (
  accessControlState : AccessControl.AccessControlState,
  subjects : Map.Map<Common.SubjectId, SubjectTypes.Subject>,
  attendance : Map.Map<Common.AttendanceId, Types.AttendanceRecord>,
  state : { var nextAttendanceId : Nat },
) {
  /// Record or update attendance for one of the signed-in caller's subjects.
  public shared ({ caller }) func recordAttendance(
    subjectId : Common.SubjectId,
    date : Common.DateKey,
    status : Types.AttendanceStatus,
  ) : async Result.Result<Types.AttendanceView, Types.AttendanceError> {
    ignore accessControlState;
    AttendanceLib.recordAttendance(subjects, attendance, state, caller, subjectId, date, status);
  };

  /// List the signed-in caller's attendance records for a subject.
  public query ({ caller }) func listAttendance(subjectId : Common.SubjectId) : async [Types.AttendanceView] {
    ignore accessControlState;
    AttendanceLib.listAttendance(attendance, caller, subjectId);
  };

  /// Delete one of the signed-in caller's attendance records.
  public shared ({ caller }) func deleteAttendance(id : Common.AttendanceId) : async ?Types.AttendanceError {
    ignore accessControlState;
    AttendanceLib.deleteAttendance(attendance, caller, id);
  };
};
