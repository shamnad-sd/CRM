import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. Deliberately excludes the Credentials provider's
 * `authorize` logic (which needs bcrypt + Mongoose, both Node-only) so this
 * file can be imported by middleware, which runs on the Edge runtime.
 * The full config (lib/auth.ts) spreads this and adds the real provider.
 */
export default {
  // Self-hosted (not Vercel) deployments must explicitly trust the host,
  // otherwise Auth.js rejects requests in production. NEXTAUTH_URL still
  // controls callback/redirect URLs.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        return isLoggedIn;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
