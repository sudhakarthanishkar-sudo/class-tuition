module {
  /// Identifier for a subject, unique per owner.
  public type SubjectId = Nat;

  /// Identifier for an attendance record, unique per owner.
  public type AttendanceId = Nat;

  /// Calendar date in ISO `YYYY-MM-DD` form.
  public type DateKey = Text;

  /// Hex colour chosen by the user for a subject tab, e.g. `#F4A261`.
  public type ColourHex = Text;
};
