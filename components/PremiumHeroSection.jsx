
const featureItems = [
  ["Adaptive questioning", "Resume-aware and role-specific rounds"],
  ["Live monitoring", "Face, focus, tab, and camera checks"],
  ["Smart reporting", "Concise PDF feedback with strengths and gaps"],
];

export default function PremiumHeroSection() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#f7f7ff_100%)]">
      <div className="ambient-video-layer absolute inset-0 opacity-25" />
      <div className="hero-grid absolute inset-0 opacity-30" />

      <div className="relative isolate w-full px-3 pt-10 sm:px-5 lg:px-6">
        <div className="mx-auto w-full max-w-[1500px] py-16 sm:py-24 lg:py-20">
          <div className="hidden">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm leading-6 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                How to use this AI interview mocker.
                <a href="/how-it-works" className="ml-1 font-semibold text-indigo-600">
                  Read more <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid items-center gap-10 xl:grid-cols-[1.14fr_0.86fr]">
            <div className="text-center lg:text-left">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                  AI Interview Intelligence
                </div>
              </div>

              <div>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl xl:text-[5.25rem]">
                  Your Personal AI Interviewer and Evaluator Coach
                </h1>
              </div>

              <div>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl lg:max-w-2xl">
                  Build real interview confidence with adaptive mock rounds, resume-driven questions, live monitoring, and concise performance reports that feel professionally coached.
                </p>
              </div>

              <div>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <a
                    href="/dashboard"
                    className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-slate-900"
                  >
                    Get started
                  </a>
                  <a
                    href="/resume-analysis"
                    className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700"
                  >
                    Explore resume analysis
                  </a>
                </div>
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-2xl xl:block">
              <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.1)]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Live Preparation Stack</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">Professional interview simulation</h2>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      Active
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {featureItems.map(([title, copy]) => (
                      <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
