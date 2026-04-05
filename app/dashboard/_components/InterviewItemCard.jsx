import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ArrowUpRight, CalendarDays, Layers3, Sparkles, Trash } from "lucide-react";
import { toast } from "sonner";
import { formatInterviewDateLabel, formatRelativeInterviewDate } from "@/utils/date";

const InterviewItemCard = ({ interview, onDeleteSuccess }) => {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const relativeDate = formatRelativeInterviewDate(interview?.createdAt);
  const formattedDate = formatInterviewDateLabel(interview?.createdAt);

  const onStart = () => {
    router.push(`/dashboard/interview/${interview?.mockId}`);
  };

  const onFeedbackPress = () => {
    router.push(`/dashboard/interview/${interview?.mockId}/feedback`);
  };

  const onDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/interviews/${interview?.mockId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete interview");
      }
      
      setIsDialogOpen(false);
      toast.success("Interview deleted successfully");
      onDeleteSuccess?.(interview?.mockId);
      router.refresh();
    } catch (error) {
      console.error("Error deleting interview:", error);
      toast.error("Failed to delete interview");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_26%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <Button
        size="sm"
        variant="outline"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border-slate-200 bg-white/90 opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
        onClick={() => setIsDialogOpen(true)}
      >
        <Trash className="text-red-600" />
      </Button>

      <div className="pr-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-700">
          <Layers3 className="h-3.5 w-3.5" />
          Interview Session
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">{interview?.jobPosition}</h2>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" />
          Ready to Resume
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
            <span>Experience: {interview?.jobExperience} Year(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>{relativeDate} · {formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-4">
        <Button size="sm" variant="outline" className="h-11 w-full rounded-2xl border-slate-200" onClick={onFeedbackPress}>
          Feedback
        </Button>
        <Button className="h-11 w-full rounded-2xl" size="sm" onClick={onStart}>
          Start
        </Button>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete this interview?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                disabled={isDeleting}
                onClick={onDelete}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewItemCard;
