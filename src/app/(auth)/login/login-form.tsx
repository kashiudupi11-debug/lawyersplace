"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, describedBy } from "@/components/ui/field";
import { Callout } from "@/components/ui/states";
import { loginAction } from "../actions";

export function LoginForm({ next, reset }: { next?: string; reset?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="mt-8 flex flex-col gap-5" noValidate>
      {reset && !state && <Callout tone="success" title="Password updated">Sign in with your new password.</Callout>}
      {state?.error && <Callout tone="danger">{state.error}</Callout>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state?.values?.email}
          required
          autoFocus={!state?.values?.email}
          aria-invalid={!!fe.email || undefined}
          aria-describedby={describedBy("email", fe.email)}
          className="h-11"
        />
      </Field>
      <Field label="Password" htmlFor="password" error={fe.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus={!!state?.values?.email}
          aria-invalid={!!fe.password || undefined}
          aria-describedby={describedBy("password", fe.password)}
          className="h-11"
        />
      </Field>
      <div className="-mt-2 flex justify-end">
        <Link href="/forgot-password" className="text-[13px] font-medium text-accent-strong hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
