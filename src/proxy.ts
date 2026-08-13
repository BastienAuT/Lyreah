import { auth } from "@/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/bibliotheque/:path*",
    "/compte/:path*",
    "/admin/:path*",
    "/lire/:path*",
  ],
};
