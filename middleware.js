import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/dashboard-prep-chat(.*)",
  "/api/fetchUserData(.*)",
  "/api/interview-report(.*)",
  "/api/interviews(.*)",
  "/api/feedback(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const authState = await auth();
  const { protect } = authState;

  if (isProtectedRoute(req)) {
    await protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
