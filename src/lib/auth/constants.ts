// Shared between the proxy (cookie-presence check) and the session module.
// `__Host-` prefix forces Secure + Path=/ + no Domain in production (HTTPS).
export const SESSION_COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-dw_session" : "dw_session";

// Hard ceiling on a session, regardless of activity.
export const SESSION_ABSOLUTE_MAX_DAYS = 7;

// Avoid a database write on every request: only refresh the sliding expiry
// when the session was last touched longer ago than this.
export const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export const LOGIN_PATH = "/login";
export const AFTER_LOGIN_PATH = "/dashboard";
