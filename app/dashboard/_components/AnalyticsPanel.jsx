"use client";

import React from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

const cardToneMap = {
  indigo: "border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 text-indigo-950",
  emerald: "border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-lime-50 text-emerald-950",
  amber: "border-amber-100 bg-gradient-to-br from-white via-amber-50 to-orange-50 text-amber-950",
  rose: "border-rose-100 bg-gradient-to-br from-white via-rose-50 to-pink-50 text-rose-950",
};

const buildLinePath = (points, width, height, padding) => {
  if (!points.length) {
    return "";
  }

  const maxValue = Math.max(...points.map((point) => point.value), 10);
  const minValue = Math.min(...points.map((point) => point.value), 0);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  return points
    .map((point, index) => {
      const normalizedValue =
        maxValue === minValue ? 0.5 : (point.value - minValue) / (maxValue - minValue);
      const x = padding + stepX * index;
      const y = height - padding - normalizedValue * chartHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
};

const getPointCoordinates = (points, width, height, padding) => {
  if (!points.length) {
    return [];
  }

  const maxValue = Math.max(...points.map((point) => point.value), 10);
  const minValue = Math.min(...points.map((point) => point.value), 0);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  return points.map((point, index) => {
    const normalizedValue =
      maxValue === minValue ? 0.5 : (point.value - minValue) / (maxValue - minValue);

    return {
      ...point,
      x: padding + stepX * index,
      y: height - padding - normalizedValue * chartHeight,
    };
  });
};

const StatCard = ({ icon: Icon, title, value, description, tone = "indigo" }) => (
  <div className={`rounded-[28px] border p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${cardToneMap[tone] || cardToneMap.indigo}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
        <p className="mt-4 text-[2.35rem] font-semibold tracking-tight">{value}</p>
        <p className="mt-2 max-w-[18rem] text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
        <Icon className="h-6 w-6 text-slate-700" />
      </div>
    </div>
  </div>
);

const ScoreTrendChart = ({ scoreTrend = [] }) => {
  const width = 640;
  const height = 260;
  const padding = 32;
  const points = scoreTrend.map((item, index) => ({
    ...item,
    label: item.label || `Session ${index + 1}`,
    value: Number(item.score || 0),
  }));
  const path = buildLinePath(points, width, height, padding);
  const coordinates = getPointCoordinates(points, width, height, padding);

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Performance Trend</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Interview score progression</h3>
          <p className="mt-2 text-sm text-slate-500">
            Track how average performance changes from one session to the next.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <TrendingUp className="h-5 w-5 text-slate-700" />
        </div>
      </div>

      {coordinates.length > 0 ? (
        <>
          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
              {[0, 2.5, 5, 7.5, 10].map((tick) => {
                const y = height - padding - (tick / 10) * (height - padding * 2);
                return (
                  <g key={tick}>
                    <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 8" />
                    <text x="8" y={y + 4} fontSize="12" fill="#64748b">
                      {tick}
                    </text>
                  </g>
                );
              })}
              <path d={path} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {coordinates.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="7" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                  <text x={point.x} y={height - 8} textAnchor="middle" fontSize="12" fill="#475569">
                    {point.label.replace("Session ", "S")}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-3">
            {scoreTrend.slice(-3).map((session) => (
              <div key={`${session.label}-${session.dateLabel}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{session.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{session.score}/10</p>
                <p className="mt-1 text-sm text-slate-500">{session.dateLabel}</p>
                <p className="mt-1 text-xs text-slate-400">{session.questions} evaluated answers</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          Finish a few interview sessions and your performance trend will appear here.
        </div>
      )}
    </div>
  );
};

const DeliveryBars = ({ deliveryTrend = [], coachInsight = null }) => {
  const latest = deliveryTrend[deliveryTrend.length - 1];
  const metrics = [
    { label: "Focus", value: latest?.focus ?? 0, color: "bg-indigo-500" },
    { label: "Confidence", value: latest?.confidence ?? 0, color: "bg-emerald-500" },
    { label: "Clarity", value: latest?.clarity ?? 0, color: "bg-amber-500" },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Delivery Snapshot</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Latest speaking quality profile</h3>
        <p className="mt-2 text-sm text-slate-500">
          Heuristic signals from your most recent session, useful for coaching delivery.
        </p>
      </div>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-2">
        <div className="space-y-5">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                <span>{metric.label}</span>
                <span>{metric.value ? `${metric.value}/10` : "N/A"}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${metric.color} transition-all duration-500`}
                  style={{ width: `${metric.value > 0 ? (metric.value / 10) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="self-start">
          <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">AI Coach Insight</p>
            <h4 className="mt-3 text-lg font-semibold text-slate-900">
              {coachInsight?.title || "Insight will appear here"}
            </h4>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
              {coachInsight?.description || "Complete a scored interview to unlock a real AI delivery insight."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightList = ({ title, icon: Icon, items, tone }) => (
  <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <div className={`rounded-2xl p-3 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
        <p className="mt-2 text-sm text-slate-500">Most repeated patterns across your recent sessions.</p>
      </div>
    </div>
    <div className="mt-5 grid gap-3">
      {items.length > 0 ? items.map((item) => (
        <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {item}
        </div>
      )) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          More completed interviews will unlock richer pattern detection here.
        </div>
      )}
    </div>
  </div>
);

const RecentSessions = ({ sessions = [] }) => (
  <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Session Journal</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Recent interview records</h3>
      </div>
      <ArrowUpRight className="mt-1 h-5 w-5 text-slate-400" />
    </div>
    <div className="mt-6 grid gap-4 2xl:grid-cols-2">
      {sessions.length > 0 ? sessions.map((session) => (
        <div key={session.mockId} className="rounded-[24px] border border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{session.jobPosition}</p>
              <p className="mt-1 text-sm text-slate-500">{session.formattedDate}</p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              {session.averageScore}/10
            </div>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Strength</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                {session.topStrengths[0] || "Strong patterns will appear after more completed answers."}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Improve Next</p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {session.topImprovementAreas[0] || "No recurring improvement theme captured yet."}
              </p>
            </div>
          </div>
        </div>
      )) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Complete an interview to start building your session journal.
        </div>
      )}
    </div>
  </div>
);

const AnalyticsPanel = ({ analytics }) => {
  const {
    totalInterviews = 0,
    bestScore = 0,
    improvementRate = 0,
    averageQuestionsPerInterview = 0,
    topStrengths = [],
    topImprovementAreas = [],
    scoreTrend = [],
    deliveryTrend = [],
    coachInsight = null,
    latestSessions = [],
  } = analytics || {};

  return (
    <section className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Target}
          title="Completed Sessions"
          value={String(totalInterviews)}
          description="Distinct interview records with scored answers."
          tone="indigo"
        />
        <StatCard
          icon={Sparkles}
          title="Best Average Score"
          value={bestScore ? `${bestScore}/10` : "N/A"}
          description="Highest average score achieved across a full session."
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          title="Improvement Rate"
          value={`${improvementRate}%`}
          description="Change from your first scored session to your latest one."
          tone="amber"
        />
        <StatCard
          icon={BrainCircuit}
          title="Avg Answers / Session"
          value={averageQuestionsPerInterview ? averageQuestionsPerInterview : "0"}
          description="How much signal each interview is generating on average."
          tone="rose"
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.6fr_0.9fr]">
        <ScoreTrendChart scoreTrend={scoreTrend} />
        <DeliveryBars deliveryTrend={deliveryTrend} coachInsight={coachInsight} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <InsightList
          title="Top Strength Patterns"
          icon={Sparkles}
          items={topStrengths.slice(0, 2)}
          tone="bg-emerald-50 text-emerald-700"
        />
        <InsightList
          title="Top Improvement Patterns"
          icon={TrendingUp}
          items={topImprovementAreas.slice(0, 2)}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <RecentSessions sessions={latestSessions.slice(0, 2)} />
    </section>
  );
};

export default AnalyticsPanel;
