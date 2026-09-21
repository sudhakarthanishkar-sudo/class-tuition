import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/attendance";
import SubjectTypes "../types/subjects";
import SubjectsLib "../lib/subjects";

module {
  /// Record attendance for `subjectId` on `date`, or update it when that date
  /// already has a record. Fails when `subjectId` is not owned by `owner`.
  public func recordAttendance(
    subjects : Map.Map<Common.SubjectId, SubjectTypes.Subject>,
    attendance : Map.Map<Common.AttendanceId, Types.AttendanceRecord>,
    state : { var nextAttendanceId : Nat },
    owner : Principal,
    subjectId : Common.SubjectId,
    date : Common.DateKey,
    status : Types.AttendanceStatus,
  ) : Result.Result<Types.AttendanceView, Types.AttendanceError> {
    if (not SubjectsLib.ownsSubject(subjects, owner, subjectId)) {
      return #err(#subjectNotFound(subjectId));
    };
    let existing = attendance.values().find(func (r) = Principal.equal(r.owner, owner) and r.subjectId == subjectId and r.date == date);
    switch (existing) {
      case (?record) {
        let updated : Types.AttendanceRecord = {
          id = record.id;
          owner = record.owner;
          subjectId = record.subjectId;
          date = record.date;
          status;
          updatedAt = Time.now();
        };
        attendance.add(record.id, updated);
        #ok(toView(updated));
      };
      case null {
        let id = state.nextAttendanceId;
        state.nextAttendanceId := id + 1;
        let record : Types.AttendanceRecord = {
          id;
          owner;
          subjectId;
          date;
          status;
          updatedAt = Time.now();
        };
        attendance.add(id, record);
        #ok(toView(record));
      };
    };
  };

  /// List every attendance record for `subjectId` owned by `owner`, newest date first.
  public func listAttendance(
    attendance : Map.Map<Common.AttendanceId, Types.AttendanceRecord>,
    owner : Principal,
    subjectId : Common.SubjectId,
  ) : [Types.AttendanceView] {
    let owned = attendance.values().filter(func (r) = Principal.equal(r.owner, owner) and r.subjectId == subjectId).toArray();
    let sorted = owned.sort(func (a, b) = if (a.date > b.date) { #less } else if (a.date < b.date) { #greater } else { #equal });
    sorted.map(func (r) = toView(r));
  };

  /// Delete one attendance record owned by `owner`.
  public func deleteAttendance(
    attendance : Map.Map<Common.AttendanceId, Types.AttendanceRecord>,
    owner : Principal,
    id : Common.AttendanceId,
  ) : ?Types.AttendanceError {
    switch (attendance.get(id)) {
      case null { ?#notFound(id) };
      case (?record) {
        if (not Principal.equal(record.owner, owner)) {
          ?#notAuthorized;
        } else {
          attendance.remove(id);
          null;
        };
      };
    };
  };

  /// Delete every attendance record belonging to `subjectId` for `owner`.
  public func deleteAttendanceForSubject(
    attendance : Map.Map<Common.AttendanceId, Types.AttendanceRecord>,
    owner : Principal,
    subjectId : Common.SubjectId,
  ) : () {
    let doomed = attendance.values().filter(func (r) = Principal.equal(r.owner, owner) and r.subjectId == subjectId).toArray();
    for (record in doomed.values()) {
      attendance.remove(record.id);
    };
  };

  /// Project a stored attendance record onto its shared view.
  public func toView(record : Types.AttendanceRecord) : Types.AttendanceView {
    {
      id = record.id;
      subjectId = record.subjectId;
      date = record.date;
      status = record.status;
      updatedAt = record.updatedAt;
    };
  };
};
