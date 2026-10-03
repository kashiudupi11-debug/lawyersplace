"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login, logout, requestPasswordReset, resetPassword, isTokenShapeValid } from "@/server/services/auth";

export type FormState = { error?: string; success?: string; fieldErrors?: Record<string, string> } | undefined;

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

/** Only allow same-site relative redirects after login (prevents open redirects). */
function safeNext(next: string | undefined, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error };
  const home = result.role === "CLIENT" ? "/portal" : "/dashboard";
  redirect(result.role === "CLIENT" ? home : safeNext(parsed.data.next, home));
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { fieldErrors: { email: "Enter a valid email address." } };
  await requestPasswordReset(email.data);
  return { success: "If an account exists for that email, a reset link has been sent. It expires in 30 minutes." };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!isTokenShapeValid(token)) return { error: "This reset link is invalid or has expired." };
  if (password !== confirm) return { fieldErrors: { confirm: "Passwords do not match." } };
  const result = await resetPassword(token, password);
  if (!result.ok) return { error: result.error };
  redirect("/login?reset=1");
}
