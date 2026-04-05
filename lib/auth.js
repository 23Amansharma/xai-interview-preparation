import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";

export const getAuthenticatedUser = async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  if (!user) {
    return null;
  }

  const primaryEmail =
    user.emailAddresses?.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    "";

  return {
    userId,
    email: primaryEmail,
    fullName:
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.username ||
      primaryEmail ||
      "Candidate",
  };
};

export const requireAuthenticatedUser = async () => {
  const user = await getAuthenticatedUser();

  if (!user?.userId || !user?.email) {
    return null;
  }

  return user;
};
