import Common "../types/common";

module {
  /// A subject tab owned by a single user.
  public type Subject = {
    id : Common.SubjectId;
    owner : Principal;
    name : Text;
    colour : Common.ColourHex;
    createdAt : Int;
  };

  /// Shared view of a subject returned across the API boundary.
  public type SubjectView = {
    id : Common.SubjectId;
    name : Text;
    colour : Common.ColourHex;
    createdAt : Int;
  };

  /// Errors a subject mutation can report to the caller.
  public type SubjectError = {
    #notFound : Common.SubjectId;
    #notAuthorized;
    #invalidName;
    #invalidColour;
  };
};
