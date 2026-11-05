import { envs } from "./envs.js";

export const SESSION_COOKIE_NAME = "sid";

const baseOptions = {
  httpOnly: true,
  secure: envs.COOKIE_SECURE,
  sameSite: envs.COOKIE_SAMESITE,
  path: "/",
};

export class SessionCookie {
  static set(res, token, maxAgeMs = envs.SESSION_TTL_HOURS * 60 * 60 * 1000) {
    res.cookie(SESSION_COOKIE_NAME, token, {
      ...baseOptions,
      maxAge: maxAgeMs,
    });
  }

  static clear(res) {
    res.clearCookie(SESSION_COOKIE_NAME, baseOptions);
  }

  static read(req) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    return typeof token === "string" && token.length > 0 ? token : null;
  }
}
