import NextAuth from "next-auth";
import Authentik from "next-auth/providers/authentik";
import { isAdminEmail } from "@/lib/auth-helpers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // behind the Cloudflare tunnel / reverse proxy
  providers: [
    Authentik({
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      issuer: process.env.AUTHENTIK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      token.isAdmin = isAdminEmail(token.email, process.env.ADMIN_EMAILS);
      return token;
    },
    async session({ session, token }) {
      session.isAdmin = token.isAdmin ?? false;
      return session;
    },
  },
});
