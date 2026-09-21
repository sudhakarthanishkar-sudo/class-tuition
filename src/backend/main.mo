import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Common "types/common";
import SubjectTypes "types/subjects";
import AttendanceTypes "types/attendance";
import SubjectsApi "mixins/subjects-api";
import AttendanceApi "mixins/attendance-api";
import ApiDocMixin "mixins/api-doc";
import AttendanceLib "lib/attendance";
import SubjectsLib "lib/subjects";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let subjects : Map.Map<Common.SubjectId, SubjectTypes.Subject>;
  let attendance : Map.Map<Common.AttendanceId, AttendanceTypes.AttendanceRecord>;
  let state : { var nextSubjectId : Nat; var nextAttendanceId : Nat };

  include SubjectsApi(accessControlState, subjects, state);
  include AttendanceApi(accessControlState, subjects, attendance, state);
  include ApiDocMixin();

  /// Delete a subject and every attendance record that belongs to it.
  public shared ({ caller }) func deleteSubjectWithAttendance(id : Common.SubjectId) : async ?SubjectTypes.SubjectError {
    let result = SubjectsLib.deleteSubject(subjects, caller, id);
    switch (result) {
      case null { AttendanceLib.deleteAttendanceForSubject(attendance, caller, id) };
      case (?_) {};
    };
    result;
  };

  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  transient let subjectToRow : SubjectTypes.Subject -> Entity.Row = func (s) {
    [
      ("id", s.id._toRow()),
      ("owner", s.owner._toRow()),
      ("name", s.name._toRow()),
      ("colour", s.colour._toRow()),
      ("createdAt", s.createdAt._toRow()),
    ];
  };

  transient let attendanceToRow : AttendanceTypes.AttendanceRecord -> Entity.Row = func (a) {
    let status : Text = switch (a.status) {
      case (#present) { "present" };
      case (#absent) { "absent" };
      case (#classCancelled) { "classCancelled" };
    };
    [
      ("id", a.id._toRow()),
      ("owner", a.owner._toRow()),
      ("subjectId", a.subjectId._toRow()),
      ("date", a.date._toRow()),
      ("status", status._toRow()),
      ("updatedAt", a.updatedAt._toRow()),
    ];
  };

  include Expose({
    entities = [
      subjects.toEntity("subject", "Subject", "id")
        .sample({ id = 0; owner = anyPrincipal; name = ""; colour = ""; createdAt = 0 })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      attendance.toEntity("attendance", "AttendanceRecord", "id", attendanceToRow)
        .sample({
          id = 0;
          owner = anyPrincipal;
          subjectId = 0;
          date = "";
          status = #present;
          updatedAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
