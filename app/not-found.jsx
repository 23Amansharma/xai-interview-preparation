import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
        <SearchX className="h-8 w-8" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist anymore or the link is incomplete.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Back to Homepage
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
