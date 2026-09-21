import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type SubjectId = Nat;
  type AttendanceId = Nat;
  type DateKey = Text;
  type ColourHex = Text;

  type Subject = {
    id : SubjectId;
    owner : Principal;
    name : Text;
    colour : ColourHex;
    createdAt : Int;
  };

  type AttendanceStatus = {
    #present;
    #absent;
    #classCancelled;
  };

  type AttendanceRecord = {
    id : AttendanceId;
    owner : Principal;
    subjectId : SubjectId;
    date : DateKey;
    status : AttendanceStatus;
    updatedAt : Int;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    subjects : Map.Map<SubjectId, Subject>;
    attendance : Map.Map<AttendanceId, AttendanceRecord>;
    state : { var nextSubjectId : Nat; var nextAttendanceId : Nat };
  };

  public func migration(_old : {}) : NewActor {
    {
      accessControlState = AccessControl.initState();
      subjects = Map.empty();
      attendance = Map.empty();
      state = { var nextSubjectId = 0; var nextAttendanceId = 0 };
    };
  };
};
