import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

// Edge-safe: uses the lightweight auth.config.ts (no bcrypt/mongoose),
// so this can run in the Edge middleware runtime.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/dashboard/:path*"],
};
