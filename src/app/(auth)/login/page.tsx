import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const user = await getSessionUser();
  if (user) redirect(user.role === "CLIENT" ? "/portal" : "/dashboard");
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <>
      <h1 className="font-display text-[32px] font-medium tracking-tight">Sign in</h1>
      <p className="mt-1.5 text-sm text-muted">Use the credentials provided by your firm administrator.</p>
      <LoginForm next={next} reset={sp.reset === "1"} />
    </>
  );
}
