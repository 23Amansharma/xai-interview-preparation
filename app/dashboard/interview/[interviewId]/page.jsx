"use client";
import { Button } from "@/components/ui/button";
import { Lightbulb, WebcamIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";

function Interview({ params }) {
  const [interviewData, setInterviewData] = useState(null);
  const [webCamEnabled, setWebCamEnabled] = useState(false);

  const parseInterviewPayload = (rawPayload) => {
    try {
      const parsedPayload = JSON.parse(rawPayload || "[]");
      if (Array.isArray(parsedPayload)) {
        return { resumeText: "", resumeFileName: "" };
      }

      return {
        resumeText: String(parsedPayload?.resumeText || ""),
        resumeFileName: String(parsedPayload?.resumeFileName || ""),
      };
    } catch (error) {
      console.error("Failed to parse interview payload:", error);
      return { resumeText: "", resumeFileName: "" };
    }
  };

  useEffect(() => {
    GetInterviewDetails();
  }, []);

  const GetInterviewDetails = async () => {
    try {
      const response = await fetch(`/api/interviews/${params.interviewId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch interview details");
      }

      if (data?.interview) {
        const payload = parseInterviewPayload(data.interview.jsonMockResp);
        setInterviewData({
          ...data.interview,
          resumeText: payload.resumeText,
          resumeFileName: payload.resumeFileName,
        });
      } else {
        toast.error("Interview details not found");
      }
    } catch (error) {
      toast.error("Error fetching interview details");
      console.error("Interview details fetch error:", error);
    }
  };

  const handleWebcamToggle = () => {
    if (!webCamEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setWebCamEnabled(true);
          toast.success("Webcam and microphone enabled");
        })
        .catch((error) => {
          toast.error("Failed to access webcam or microphone");
          console.error("Webcam access error:", error);
        });
    } else {
      setWebCamEnabled(false);
    }
  };

  if (!interviewData) {
    return <div>Loading interview details...</div>;
  }

  return (
    <div className="my-10">
      <h2 className="font-bold text-2xl">Let's get started</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col my-5 gap-5">
          <div className="flex flex-col p-5 rounded-lg border gap-5">
            <h2 className="text-lg">
              <strong>Job Role/Job Position: </strong>
              {interviewData.jobPosition}
            </h2>
            <h2 className="text-lg">
              <strong>Job Description/Tech Stack: </strong>
              {interviewData.jobDesc}
            </h2>
            <h2 className="text-lg">
              <strong>Years of Experience: </strong>
              {interviewData.jobExperience}
            </h2>
            <h2 className="text-lg">
              <strong>Resume Context: </strong>
              {interviewData.resumeFileName
                ? `${interviewData.resumeFileName} uploaded`
                : interviewData.resumeText
                ? "Resume text added"
                : "No resume uploaded"}
            </h2>
          </div>
          <div className="p-5 border rounded-lg border-yellow-300 bg-yellow-100">
            <h2 className="flex gap-2 items-center text-yellow-500">
              <Lightbulb />
              <span>Information</span>
            </h2>
            <h2 className="mt-3 text-yellow-500">
              Enable Video Web Cam and Microphone to start your adaptive AI mock interview. 
              It will begin with a self-introduction question and continue with 10-15 role and project-based questions generated live from your answers.
              {interviewData.resumeText
                ? " Since you added a resume, the interview will stay focused on that resume plus the target role."
                : ""}
              NOTE: Webcam monitoring stays on during the interview and repeated violations can end the session.
            </h2>
          </div>
        </div>
        <div>
          {webCamEnabled ? (
            <Webcam
              mirrored={true}
              style={{ height: 300, width: "auto" }}
              onUserMedia={() => setWebCamEnabled(true)}
              onUserMediaError={() => {
                toast.error("Webcam access error");
                setWebCamEnabled(false);
              }}
            />
          ) : (
            <>
              <WebcamIcon className="h-72 my-7 border rounded-lg w-full p-20 bg-secondary" />
              <Button
                className="w-full"
                variant="ghost"
                onClick={handleWebcamToggle}
              >
                Enable Web Cam and Microphone
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-end items-end">
        <Link href={`/dashboard/interview/${params.interviewId}/start`}>
          <Button>Start Interview</Button>
        </Link>
      </div>
    </div>
  );
}

export default Interview;
