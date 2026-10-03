"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, describedBy } from "@/components/ui/field";
import { Callout } from "@/components/ui/states";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined);
  const err = state?.fieldErrors?.email;
  return (
    <>
      <title>Reset password · LegalDesk</title>
      <h1 className="font-display text-[32px] font-medium tracking-tight">Reset password</h1>
      <p className="mt-1.5 text-sm text-muted">Enter your account email and we&apos;ll send a secure reset link.</p>
      {state?.success ? (
        <div className="mt-8">
          <Callout tone="success" title="Check your email">{state.success}</Callout>
        </div>
      ) : (
        <form action={action} className="mt-8 flex flex-col gap-5" noValidate>
          <Field label="Email" htmlFor="email" error={err}>
            <Input id="email" name="email" type="email" autoComplete="email" required autoFocus className="h-11"
              aria-invalid={!!err || undefined} aria-describedby={describedBy("email", err)} />
          </Field>
          <Button type="submit" size="lg" loading={pending}>Send reset link</Button>
        </form>
      )}
      <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden /> Back to sign in
      </Link>
    </>
  );
}
