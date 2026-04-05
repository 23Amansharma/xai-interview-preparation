'use client'
import {
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  Target,
  ChartNoAxesCombined,
  MessageSquareQuote,
} from 'lucide-react'

const pillars = [
  {
    icon: <BrainCircuit className="h-8 w-8 text-cyan-500" />,
    title: "Adaptive Interviews",
    description: "Questions evolve with every answer, so practice feels closer to a real interviewer than a static quiz."
  },
  {
    icon: <ChartNoAxesCombined className="h-8 w-8 text-indigo-600" />,
    title: "Actionable Feedback",
    description: "Each session turns into a report with scoring, strengths, weaknesses, and next steps you can actually use."
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-emerald-500" />,
    title: "Professional Practice",
    description: "Camera, focus, and delivery signals help simulate the discipline and pressure of an actual interview room."
  },
]

const principles = [
  "Clarity over clutter: every feature should help candidates prepare faster and better.",
  "Feedback over guesswork: users should know exactly what improved and what still needs work.",
  "Realism over gimmicks: the experience should feel like serious interview practice, not a toy demo.",
]

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f3f7fb_100%)] py-6 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-[1680px]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-10 px-6 py-10 md:grid-cols-[1.25fr_0.9fr] md:px-10 md:py-14 xl:gap-14 2xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                About The Platform
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Intivolution AI is built to make interview practice feel serious, smart, and personal.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                We designed Intivolution AI for candidates who want more than random mock questions. The platform combines role-specific questioning, resume context, voice-based answering, and feedback analytics to turn every practice session into measurable progress.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-[linear-gradient(145deg,#0f172a_0%,#111827_100%)] p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Focus</p>
                  <p className="mt-2 text-lg font-bold">Interview readiness</p>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-[linear-gradient(180deg,#eef2ff_0%,#f8faff_100%)] p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">Approach</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">Role + resume aware</p>
                </div>
                <div className="rounded-2xl border border-cyan-100 bg-[linear-gradient(180deg,#ecfeff_0%,#f7fdff_100%)] p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Outcome</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">Clear improvement path</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Why It Exists</p>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Preparation should feel like an advantage, not a guessing game.</h2>
              <div className="mt-6 space-y-4">
                {principles.map((principle) => (
                  <div key={principle} className="rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm leading-7 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    {principle}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-5 text-white shadow-[0_18px_36px_rgba(59,130,246,0.22)]">
                <MessageSquareQuote className="h-6 w-6" />
                <p className="mt-3 text-sm leading-7 text-indigo-50">
                  The goal is simple: help candidates sound more confident, think more clearly, and walk into real interviews with evidence-backed preparation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                {pillar.icon}
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{pillar.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#eef2ff_0%,#ffffff_44%,#ecfeff_100%)] px-6 py-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:px-10">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Product Direction</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                A cleaner path from practice to performance.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                The product direction is simple: reduce noise, keep feedback specific, and make every practice round feel useful enough to improve real interview outcomes.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[1.6rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-500">System Thinking</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Intivolution AI is not just about generating questions. It builds a feedback loop where candidates can see progress across sessions, understand what strong answers look like, and practice in a more structured environment.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">Execution Focus</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  That is why the platform emphasizes resume-aware interviews, adaptive questioning, live monitoring, and session reports instead of generic one-size-fits-all mock tests.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-indigo-100 bg-[linear-gradient(135deg,rgba(79,70,229,0.08)_0%,rgba(14,165,233,0.08)_100%)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Result</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  The experience should feel professional, measurable, and genuinely useful for candidates preparing for serious opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutUsPage
