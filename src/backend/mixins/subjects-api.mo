import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/subjects";
import SubjectsLib "../lib/subjects";

mixin (
  accessControlState : AccessControl.AccessControlState,
  subjects : Map.Map<Common.SubjectId, Types.Subject>,
  state : { var nextSubjectId : Nat },
) {
  /// Create a subject owned by the signed-in caller.
  public shared ({ caller }) func createSubject(name : Text, colour : Common.ColourHex) : async Types.SubjectView {
    ignore accessControlState;
    SubjectsLib.createSubject(subjects, state, caller, name, colour);
  };

  /// List the signed-in caller's subjects.
  public query ({ caller }) func listSubjects() : async [Types.SubjectView] {
    ignore accessControlState;
    SubjectsLib.listSubjects(subjects, caller);
  };

  /// Delete one of the signed-in caller's subjects.
  public shared ({ caller }) func deleteSubject(id : Common.SubjectId) : async ?Types.SubjectError {
    ignore accessControlState;
    SubjectsLib.deleteSubject(subjects, caller, id);
  };
};
