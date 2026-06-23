import type { DefaultSession } from "next-auth";

// Auth.js v5 (next-auth@beta) re-exports Session from @auth/core/types and JWT from
// @auth/core/jwt. Declaration merging must target the declaring module, not re-exports.
declare module "@auth/core/types" {
  interface Session {
    isAdmin: boolean;
    user: DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    isAdmin?: boolean;
  }
}
