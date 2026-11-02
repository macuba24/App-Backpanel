"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useT } from "@/lib/locale";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const t = useT();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await saveProfile({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      currentPassword: String(form.get("currentPassword") ?? ""),
      newPassword: String(form.get("newPassword") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("Persönliche Daten gespeichert.", "Personal details saved."));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Persönliche Daten", "Personal details")}</CardTitle>
        <CardDescription>{t("Dieses Konto steuert genau eine App.", "This account controls exactly one app.")}</CardDescription>
      </CardHeader>
      <form onSubmit={(event) => void onSubmit(event)}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("Name", "Name")}</Label>
            <Input id="name" name="name" defaultValue={name} autoComplete="name" required disabled={pending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">{t("E-Mail", "Email")}</Label>
            <Input
              id="profile-email"
              name="email"
              type="email"
              defaultValue={email}
              autoComplete="username"
              required
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">{t("Aktuelles Passwort", "Current password")}</Label>
            <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required disabled={pending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">{t("Neues Passwort", "New password")}</Label>
            <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" disabled={pending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">{t("Neues Passwort wiederholen", "Repeat new password")}</Label>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" disabled={pending} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {t("Speichern", "Save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
