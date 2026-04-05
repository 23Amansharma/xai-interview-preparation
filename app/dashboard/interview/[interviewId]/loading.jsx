export default function InterviewLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-0 py-6">
      <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-40 rounded-full bg-slate-100" />
        <div className="mt-5 h-10 w-3/4 rounded-2xl bg-slate-100" />
        <div className="mt-4 h-5 w-1/2 rounded-xl bg-slate-100" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-32 rounded bg-slate-100" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-36 rounded bg-slate-100" />
          <div className="mt-6 h-72 rounded-[28px] bg-slate-100" />
          <div className="mt-5 h-12 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
