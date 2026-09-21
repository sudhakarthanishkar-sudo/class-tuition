import Common "../types/common";

module {
  /// The three attendance outcomes a user can record for a class date.
  public type AttendanceStatus = {
    #present;
    #absent;
    #classCancelled;
  };

  /// An attendance record for one subject on one date, owned by a single user.
  public type AttendanceRecord = {
    id : Common.AttendanceId;
    owner : Principal;
    subjectId : Common.SubjectId;
    date : Common.DateKey;
    status : AttendanceStatus;
    updatedAt : Int;
  };

  /// Shared view of an attendance record returned across the API boundary.
  public type AttendanceView = {
    id : Common.AttendanceId;
    subjectId : Common.SubjectId;
    date : Common.DateKey;
    status : AttendanceStatus;
    updatedAt : Int;
  };

  /// Errors an attendance mutation can report to the caller.
  public type AttendanceError = {
    #notFound : Common.AttendanceId;
    #subjectNotFound : Common.SubjectId;
    #notAuthorized;
    #invalidDate;
  };
};
