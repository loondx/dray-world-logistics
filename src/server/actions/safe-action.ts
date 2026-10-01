import "server-only";

import { unstable_rethrow } from "next/navigation";

import { failure, type ActionResult } from "@/lib/forms/action-result";
import { logger } from "@/lib/logger";
import { AuthorizationError } from "@/server/auth/guards";
import { UserFacingError } from "@/server/errors";

// Runs an action body and converts unexpected failures into a safe, generic
// message. Database/stack details are logged server-side, never returned.
export async function safeAction<TData>(
  name: string,
  body: () => Promise<ActionResult<TData>>,
  fallbackMessage = "Something went wrong. Please try again.",
): Promise<ActionResult<TData>> {
  try {
    return await body();
  } catch (error) {
    unstable_rethrow(error); // let redirect()/notFound() propagate
    if (error instanceof AuthorizationError || error instanceof UserFacingError) {
      return failure(error.message);
    }
    logger.error(`Action failed: ${name}`, error);
    return failure(fallbackMessage);
  }
}
