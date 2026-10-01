// An error whose message is safe to show to the user as-is (business-rule
// violations such as "carrier is archived"). Anything else is logged and
// replaced with a generic message.
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}
