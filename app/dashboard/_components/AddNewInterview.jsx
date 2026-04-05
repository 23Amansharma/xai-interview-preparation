"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { JOB_ROLE_SUGGESTIONS, TECH_STACK_SUGGESTIONS } from "@/utils/roles";
import { extractReadableText } from "@/utils/resume-utils";

function AddNewInterview({ isOpen, onClose, hideTrigger = false }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumePreviewUrl, setResumePreviewUrl] = useState("");
  const [resumeFileType, setResumeFileType] = useState("");
  const [resumeUploadStatus, setResumeUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (typeof isOpen === "boolean") {
      setOpenDialog(isOpen);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (resumePreviewUrl) {
        URL.revokeObjectURL(resumePreviewUrl);
      }
    };
  }, [resumePreviewUrl]);

  const handleDialogChange = (nextOpenState) => {
    setOpenDialog(nextOpenState);
    if (!nextOpenState) {
      onClose?.();
    }
  };

  // Auto-suggest tech stack based on job role
  const autoSuggestTechStack = (role) => {
    const suggestion = TECH_STACK_SUGGESTIONS[role];
    if (suggestion) {
      setJobDescription(suggestion);
      toast.info(`Auto-filled tech stack for ${role}`);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      if (resumePreviewUrl) {
        URL.revokeObjectURL(resumePreviewUrl);
      }

      setResumeFileName(file.name);
      setResumeFileType(file.type || "");
      setResumeUploadStatus("");

      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        setResumePreviewUrl(URL.createObjectURL(file));
        setResumeText("");
        toast.success("PDF preview ready.");
        setResumeUploadStatus("PDF preview is available, but resume-based personalization is limited until text extraction support is added.");
        return;
      }

      const normalizedText = await extractReadableText(file);
      const suspiciousCharacters =
        (normalizedText.match(/[^\x09\x0A\x0D\x20-\x7E]/g) || []).length;
      const suspiciousRatio = normalizedText.length
        ? suspiciousCharacters / normalizedText.length
        : 0;

      if (!normalizedText || suspiciousRatio > 0.2) {
        setResumePreviewUrl("");
        setResumeText("");
        setResumeUploadStatus("This file could not be converted into clean text, so interview personalization will ignore its content.");
        toast.warning("Resume preview looked unreadable.", {
          description: "Try a cleaner text-based resume file for better interview personalization.",
        });
        return;
      }

      setResumePreviewUrl("");
      setResumeText(normalizedText);
      setResumeUploadStatus("Resume content was extracted and will be used to personalize interview questions.");

      if (normalizedText.length < 80) {
        toast.warning("Resume text looks very short.", {
          description: "Questions may use limited resume context because the extracted text is very short.",
        });
      } else {
        toast.success("Resume added for interview personalization.");
      }
    } catch (error) {
      console.error("Resume upload error:", error);
      toast.error("Unable to read this resume file.", {
        description: "Please try a text-based file such as TXT, MD, DOC, or DOCX.",
      });
      setResumeUploadStatus("This resume could not be processed, so interview personalization will continue without resume text.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isSignedIn) {
        throw new Error("Please sign in before creating an interview.");
      }

      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobPosition,
          jobDescription,
          jobExperience,
          resumeText: resumeText.trim(),
          resumeFileName: resumeFileName || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create interview.");
      }
      
      toast.success('Interview created successfully!');
      onClose?.();
      router.push(`/dashboard/interview/${data?.interview?.mockId}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error('Failed to create interview.', {
        description: error?.message || "Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!hideTrigger && (
        <div
          className="group flex min-h-[190px] cursor-pointer flex-col justify-between rounded-[26px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
          onClick={() => setOpenDialog(true)}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-semibold text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
            +
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Add New Interview</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Start a tailored mock interview with role, stack, experience, and optional resume context.
            </p>
          </div>
        </div>
      )}
      <Dialog open={openDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-2xl">
              Create Your Interview Preparation
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div>
                <div className="mt-7 my-3">
                  <label>Job Role/Position</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Ex. Full Stack Developer"
                      value={jobPosition}
                      required
                      onChange={(e) => setJobPosition(e.target.value)}
                      list="jobRoles"
                    />
                    <datalist id="jobRoles">
                      {JOB_ROLE_SUGGESTIONS.map(role => (
                        <option key={role} value={role} />
                      ))}
                    </datalist>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => autoSuggestTechStack(jobPosition)}
                      disabled={!jobPosition}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="my-3">
                  <label>Job Description/Tech Stack</label>
                  <Textarea
                    placeholder="Ex. React, Angular, NodeJs, MySql etc"
                    value={jobDescription}
                    required
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
                <div className="my-3">
                  <label>Years of Experience</label>
                  <Input
                    placeholder="Ex. 5"
                    type="number"
                    min="0"
                    max="70"
                    value={jobExperience}
                    required
                    onChange={(e) => setJobExperience(e.target.value)}
                  />
                </div>
                <div className="my-3">
                  <label className="block">Resume Upload (Optional)</label>
                  <Input
                    type="file"
                    accept=".txt,.md,.pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Uploading a resume is optional. TXT, MD, DOC, and DOCX files work best for interview personalization.
                  </p>
                  {resumeFileName && (
                    <p className="mt-2 text-sm text-emerald-700">
                      Selected resume: {resumeFileName}
                    </p>
                  )}
                  {resumeUploadStatus && (
                    <p className="mt-2 text-xs text-slate-600">
                      {resumeUploadStatus}
                    </p>
                  )}
                </div>
                {resumePreviewUrl && (
                  <div className="my-3">
                    <label className="block">Resume Preview</label>
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <iframe
                        src={resumePreviewUrl}
                        title="Resume PDF Preview"
                        className="h-[420px] w-full"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      PDF is shown in preview mode, but interview personalization may stay limited until text extraction support is added.
                    </p>
                  </div>
                )}
                {resumeFileType && resumeFileType !== "application/pdf" && !resumeText && (
                  <p className="my-3 text-xs text-amber-600">
                    This file could not be converted into clean text, so interview questions will rely on the role and tech stack instead.
                  </p>
                )}
              </div>
              <div className="flex gap-5 justify-end">
                <Button type="button" variant="ghost" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoaderCircle className="animate-spin mr-2" /> Generating
                    </>
                  ) : (
                    'Start Interview'
                  )}
                </Button>
              </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;
