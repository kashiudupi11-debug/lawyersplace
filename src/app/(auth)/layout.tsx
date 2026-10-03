import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-navy-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px]"
        />
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-brass-500/10 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md border border-brass-500/40 bg-brass-500/10">
            <Scale className="size-4.5 text-brass-300" aria-hidden />
          </span>
          <span className="font-display text-xl tracking-tight">LegalDesk</span>
        </Link>
        <div className="relative max-w-md">
          <p className="font-display text-[40px] leading-[1.1] tracking-tight">
            Every matter, hearing and deadline. <em className="text-brass-300">In order.</em>
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-white/60">
            A secure workspace for your practice: clients, cases, documents, calendar and billing in one place.
          </p>
        </div>
        <p className="relative text-xs text-white/40">Confidential system. Access is logged and restricted to authorised users.</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <Scale className="size-5 text-brass-600" aria-hidden />
            <span className="font-display text-xl">LegalDesk</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
