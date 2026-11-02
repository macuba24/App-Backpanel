import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login/login-form";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "Anmeldung",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="desk flex min-h-svh items-center justify-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
