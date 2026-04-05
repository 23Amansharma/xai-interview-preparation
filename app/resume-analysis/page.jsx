"use client";

import React from "react";
import { Sparkles, Target, FileSearch } from "lucide-react";
import ResumeAnalyzerSection from "@/components/resume/ResumeAnalyzerSection";

export default function ResumeAnalysisPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ede9fe_0%,#ffffff_36%,#f8fafc_100%)] py-6 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-[1680px]">
        <section className="rounded-[36px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                <FileSearch className="h-4 w-4" />
                Resume Analysis Studio
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Professional ATS resume review with role-specific AI feedback
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Upload your resume, target any role or department, and get an ATS-style score, practical corrections, keyword gaps, and a polished summary rewrite that feels realistic and recruiter-aware.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {[
                {
                  icon: <Sparkles className="h-5 w-5 text-indigo-600" />,
                  title: "Smart ATS score",
                  text: "Balanced review of keyword relevance, clarity, impact, and structure.",
                },
                {
                  icon: <Target className="h-5 w-5 text-emerald-600" />,
                  title: "Role-personalized fixes",
                  text: "Suggestions shift for tech, sales, marketing, business, and core engineering roles.",
                },
                {
                  icon: <FileSearch className="h-5 w-5 text-amber-600" />,
                  title: "Detailed recruiter-style report",
                  text: "Action plan, section review, keyword gaps, and summary rewrite in one clean report.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">{item.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8">
          <ResumeAnalyzerSection
            title="Analyze your resume before you apply"
            subtitle="Built for students and job seekers across software, core engineering, analytics, business, marketing, sales, operations, and more."
          />
        </div>
      </div>
    </div>
  );
}
