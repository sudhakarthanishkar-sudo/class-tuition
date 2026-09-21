import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/subjects";

module {
  /// Create a subject owned by `owner` and return its shared view.
  public func createSubject(
    subjects : Map.Map<Common.SubjectId, Types.Subject>,
    state : { var nextSubjectId : Nat },
    owner : Principal,
    name : Text,
    colour : Common.ColourHex,
  ) : Types.SubjectView {
    let id = state.nextSubjectId;
    state.nextSubjectId := id + 1;
    let subject : Types.Subject = {
      id;
      owner;
      name;
      colour;
      createdAt = Time.now();
    };
    subjects.add(id, subject);
    toView(subject);
  };

  /// List every subject owned by `owner`, newest first.
  public func listSubjects(
    subjects : Map.Map<Common.SubjectId, Types.Subject>,
    owner : Principal,
  ) : [Types.SubjectView] {
    let owned = subjects.values().filter(func (s) = Principal.equal(s.owner, owner)).toArray();
    let sorted = owned.sort(func (a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
    sorted.map(func (s) = toView(s));
  };

  /// Delete a subject owned by `owner`; fails when it is missing or not theirs.
  public func deleteSubject(
    subjects : Map.Map<Common.SubjectId, Types.Subject>,
    owner : Principal,
    id : Common.SubjectId,
  ) : ?Types.SubjectError {
    switch (subjects.get(id)) {
      case null { ?#notFound(id) };
      case (?subject) {
        if (not Principal.equal(subject.owner, owner)) {
          ?#notAuthorized;
        } else {
          subjects.remove(id);
          null;
        };
      };
    };
  };

  /// True when `id` exists and belongs to `owner`.
  public func ownsSubject(
    subjects : Map.Map<Common.SubjectId, Types.Subject>,
    owner : Principal,
    id : Common.SubjectId,
  ) : Bool {
    switch (subjects.get(id)) {
      case null { false };
      case (?subject) { Principal.equal(subject.owner, owner) };
    };
  };

  /// Project a stored subject onto its shared view.
  public func toView(subject : Types.Subject) : Types.SubjectView {
    {
      id = subject.id;
      name = subject.name;
      colour = subject.colour;
      createdAt = subject.createdAt;
    };
  };
};
