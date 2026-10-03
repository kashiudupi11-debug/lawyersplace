"use client";

import { use, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, describedBy } from "@/components/ui/field";
import { Callout } from "@/components/ui/states";
import { resetPasswordAction } from "../../actions";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <>
      <title>Choose a new password · LegalDesk</title>
      <h1 className="font-display text-[32px] font-medium tracking-tight">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-muted">This will sign you out of all other devices.</p>
      <form action={action} className="mt-8 flex flex-col gap-5" noValidate>
        {state?.error && <Callout tone="danger">{state.error}</Callout>}
        <input type="hidden" name="token" value={token} />
        <Field label="New password" htmlFor="password" hint="At least 10 characters, including a letter and a number.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10}
            className="h-11" aria-describedby="password-hint" />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={fe.confirm}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="h-11"
            aria-invalid={!!fe.confirm || undefined} aria-describedby={describedBy("confirm", fe.confirm)} />
        </Field>
        <Button type="submit" size="lg" loading={pending}>Update password</Button>
      </form>
    </>
  );
}
