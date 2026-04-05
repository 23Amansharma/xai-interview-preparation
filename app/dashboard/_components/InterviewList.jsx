"use client";
import React, { useEffect, useState } from "react";
import { Brain, Sparkles } from "lucide-react";
import InterviewItemCard from "./InterviewItemCard"

const InterviewList = ({ sessions = [], onAddNew }) => {
  const [InterviewList, setInterviewList] = useState([]);

  useEffect(() => {
    setInterviewList(Array.isArray(sessions) ? sessions : []);
  }, [sessions]);

  const handleDeleteSuccess = (mockId) => {
    setInterviewList((previousList) =>
      previousList.filter((item) => item.mockId !== mockId)
    );
  };

  return (
    <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Session Archive</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Previous Mock Interviews</h2>
        </div>
        <p className="text-sm text-slate-500">Review, resume, or remove older sessions.</p>
      </div>
      {InterviewList.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
            <Brain className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-slate-900">No interviews yet</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Start your first AI mock interview to generate role-specific questions, track your progress, and unlock detailed feedback reports.
          </p>
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Sparkles className="h-4 w-4" />
              Create First Interview
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {InterviewList.map((interview, index) => (
            <InterviewItemCard interview={interview} key={interview?.mockId || index} onDeleteSuccess={handleDeleteSuccess} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewList;
