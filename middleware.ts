import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  //allowing public access to the following api endpoints so clerk can ping it with new events
  publicRoutes: ["/", "/api/webhooks/clerk", "/api/webhooks/stripe"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
