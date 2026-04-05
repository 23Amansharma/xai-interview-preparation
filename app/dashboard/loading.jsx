export default function DashboardLoading() {
  return (
    <div className="w-full animate-pulse px-0 py-4">
      <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-36 rounded-full bg-slate-100" />
        <div className="mt-5 h-12 max-w-2xl rounded-2xl bg-slate-100" />
        <div className="mt-4 h-5 max-w-3xl rounded-xl bg-slate-100" />
      </div>

      <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-32 rounded-full bg-slate-100" />
        <div className="mt-5 h-10 w-72 rounded-2xl bg-slate-100" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 rounded-[28px] bg-slate-100" />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-72 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-6 w-28 rounded-full bg-slate-100" />
            <div className="mt-6 h-8 w-3/4 rounded-xl bg-slate-100" />
            <div className="mt-5 h-4 w-full rounded bg-slate-100" />
            <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
            <div className="mt-8 flex gap-3">
              <div className="h-11 flex-1 rounded-2xl bg-slate-100" />
              <div className="h-11 flex-1 rounded-2xl bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
