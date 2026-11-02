import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/dashboard/profile-form";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });
  if (!user) redirect("/login");

  return <ProfileForm name={user.name} email={user.email} />;
}
