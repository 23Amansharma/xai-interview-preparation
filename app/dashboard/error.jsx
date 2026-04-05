"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-slate-900">Dashboard couldn&apos;t load</h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
        {error?.message || "An unexpected problem interrupted the dashboard. Please try again."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
