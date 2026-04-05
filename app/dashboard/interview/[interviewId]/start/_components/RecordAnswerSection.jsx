"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState, useRef } from "react";
import { Mic, StopCircle, Loader2, Camera, CameraOff, ClipboardPenLine, Code2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { extractJsonFromText } from "@/utils/gemini-response";
import { formatLegacyInterviewDate } from "@/utils/date";

const CAMERA_BLOCKING_VIOLATIONS = new Set(["no_face", "multiple_faces", "camera_off"]);
const STABLE_CLEAR_THRESHOLD = 2;

const VIOLATION_CONFIG = {
  normal: {
    label: "Monitoring active",
    reason: "Candidate is visible and interview monitoring is active.",
  },
  no_face: {
    label: "No face detected",
    reason: "Your face is not clearly visible. Return to frame to continue the interview.",
  },
  multiple_faces: {
    label: "Multiple faces detected",
    reason: "Only the candidate should remain in frame. Ask others to leave the camera view.",
  },
  off_center: {
    label: "Face off-center",
    reason: "Please stay centered on camera like a real interview setup.",
  },
  camera_off: {
    label: "Camera off",
    reason: "Turn your webcam back on to continue the interview.",
  },
  limited_browser_support: {
    label: "Limited browser support",
    reason: "Face detection is unavailable in this browser. Focus checks will continue in fallback mode.",
  },
};

const sendGeminiPrompt = async (prompt) => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      generationMode: "interview_feedback",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to generate interview feedback.");
  }

  return String(data?.text || "");
};

const RecordAnswerSection = ({ 
  mockInterviewQuestion, 
  activeQuestionIndex, 
  interviewData, 
  proctoringState,
  onAnswerSave,
  onProctoringUpdate,
  onInterviewTerminated,
  interviewTerminated,
  isGeneratingQuestion,
  isQuestionBeingSpoken,
  currentQuestion,
  questionTimeLeft,
  questionTimerExpired,
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [codingAnswer, setCodingAnswer] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [monitoringSupported, setMonitoringSupported] = useState(true);
  const [visionSupported, setVisionSupported] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const recognitionRef = useRef(null);
  const webcamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const proctoringRef = useRef({
    warningsCount: 0,
    warningMessages: [],
    hiddenTabEvents: 0,
    noFaceEvents: 0,
    multipleFaceEvents: 0,
    offCenterEvents: 0,
    checks: 0,
    faceVisibleChecks: 0,
    centeredChecks: 0,
    lastWarningAt: 0,
    currentViolation: "normal",
    currentViolationLabel: VIOLATION_CONFIG.normal.label,
    currentViolationReason: VIOLATION_CONFIG.normal.reason,
    currentViolationStartedAt: 0,
    stableGoodChecks: 0,
  });
  const recordingStartedAtRef = useRef(null);
  const proctoringIntervalRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const lastAutoStartedQuestionRef = useRef(-1);
  const silenceTimeoutRef = useRef(null);
  const loadingRef = useRef(false);
  const webcamEnabledRef = useRef(false);
  const interviewTerminatedRef = useRef(false);
  const isGeneratingQuestionRef = useRef(false);
  const isQuestionBeingSpokenRef = useRef(false);
  const autoStartAttemptedRef = useRef(false);
  const handledTimerExpiryRef = useRef(false);
  const currentPrompt = currentQuestion || mockInterviewQuestion?.[activeQuestionIndex] || {};
  const isCodingQuestion = currentPrompt?.questionType === "coding";
  const showOverlayViolation =
    proctoringState?.currentViolation &&
    proctoringState.currentViolation !== "normal" &&
    proctoringState.currentViolation !== "limited_browser_support";

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    webcamEnabledRef.current = webcamEnabled;
  }, [webcamEnabled]);

  useEffect(() => {
    interviewTerminatedRef.current = interviewTerminated;
  }, [interviewTerminated]);

  useEffect(() => {
    isGeneratingQuestionRef.current = isGeneratingQuestion;
  }, [isGeneratingQuestion]);

  useEffect(() => {
    isQuestionBeingSpokenRef.current = isQuestionBeingSpoken;
  }, [isQuestionBeingSpoken]);

  const formatTime = (seconds = 0) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const clearSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  const stopRecognition = (shouldResume = false) => {
    shouldKeepListeningRef.current = shouldResume;
    clearSilenceTimeout();
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error("Speech recognition stop error:", error);
    }
  };

  const startRecognition = ({ automatic = false } = {}) => {
    if (!recognitionRef.current) {
      setSpeechReady(false);
      return false;
    }

    if (
      interviewTerminatedRef.current ||
      loadingRef.current ||
      isGeneratingQuestionRef.current ||
      isQuestionBeingSpokenRef.current
    ) {
      return false;
    }

    shouldKeepListeningRef.current = automatic;
    clearSilenceTimeout();

    try {
      if (!micReady && audioStreamRef.current?.getAudioTracks()?.length > 0) {
        setMicReady(true);
      }
      recognitionRef.current.start();
      setIsRecording(true);
      recordingStartedAtRef.current = Date.now();
      return true;
    } catch (error) {
      const message = String(error?.message || error);
      if (!message.toLowerCase().includes("already started")) {
        toast.error("Unable to start live voice capture.");
        console.error("Speech recognition start error:", error);
      }
      return false;
    }
  };

  const emitProctoringUpdate = () => {
    onProctoringUpdate?.({
      ...proctoringRef.current,
      monitoringSupported,
      visionSupported,
      micReady,
      speechReady,
    });
  };

  const applyViolationState = (violation) => {
    const nextViolation = violation || "normal";
    const details = VIOLATION_CONFIG[nextViolation] || VIOLATION_CONFIG.normal;
    const previousViolation = proctoringRef.current.currentViolation;

    if (nextViolation === "normal") {
      proctoringRef.current.stableGoodChecks += 1;
      if (previousViolation !== "normal" && proctoringRef.current.stableGoodChecks < STABLE_CLEAR_THRESHOLD) {
        return;
      }
    } else {
      proctoringRef.current.stableGoodChecks = 0;
    }

    if (previousViolation === nextViolation) {
      if (
        proctoringRef.current.currentViolationLabel !== details.label ||
        proctoringRef.current.currentViolationReason !== details.reason
      ) {
        proctoringRef.current.currentViolationLabel = details.label;
        proctoringRef.current.currentViolationReason = details.reason;
        emitProctoringUpdate();
      }
      return;
    }

    proctoringRef.current.currentViolation = nextViolation;
    proctoringRef.current.currentViolationLabel = details.label;
    proctoringRef.current.currentViolationReason = details.reason;
    proctoringRef.current.currentViolationStartedAt =
      nextViolation === "normal" ? 0 : Date.now();
    emitProctoringUpdate();
  };

  const hasBlockingViolation = () =>
    CAMERA_BLOCKING_VIOLATIONS.has(proctoringRef.current.currentViolation);

  const issueWarning = (message) => {
    const now = Date.now();
    if (now - proctoringRef.current.lastWarningAt < 6000) {
      return;
    }

    proctoringRef.current.lastWarningAt = now;
    proctoringRef.current.warningsCount += 1;
    proctoringRef.current.warningMessages = [
      ...proctoringRef.current.warningMessages,
      message,
    ].slice(-5);
    emitProctoringUpdate();

    toast.warning(`Interview warning ${proctoringRef.current.warningsCount}/3`, {
      description: message,
    });

    if (proctoringRef.current.warningsCount >= 3) {
      toast.error("Interview terminated", {
        description: "Repeated monitoring violations were detected.",
      });
      onInterviewTerminated?.({
        reason: "Repeated monitoring violations were detected.",
        details: proctoringRef.current.warningMessages,
      });
    }
  };

  const countOccurrences = (text, patterns) => {
    return patterns.reduce((count, pattern) => {
      const matches = text.match(new RegExp(`\\b${pattern}\\b`, "gi"));
      return count + (matches ? matches.length : 0);
    }, 0);
  };

  const tokenizeKeywords = (text) => {
    return [...new Set(
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 4)
    )];
  };

  const clampScore = (value) => Math.max(1, Math.min(10, Math.round(value)));

  const isGeminiQuotaError = (error) => {
    const message = String(error?.message || "").toLowerCase();
    return (
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("resource_exhausted")
    );
  };

  const isGeminiRetryableError = (error) => {
    const message = String(error?.message || "").toLowerCase();
    return (
      isGeminiQuotaError(error) ||
      message.includes("timed out") ||
      message.includes("took too long") ||
      message.includes("please retry") ||
      message.includes("unavailable") ||
      message.includes("503") ||
      message.includes("500") ||
      message.includes("failed to fetch")
    );
  };

  const buildDeliverySignals = (answer, referenceAnswer) => {
    const normalizedAnswer = String(answer || "").trim().toLowerCase();
    const wordCount = normalizedAnswer ? normalizedAnswer.split(/\s+/).length : 0;
    const fillerCount = countOccurrences(normalizedAnswer, [
      "um",
      "uh",
      "like",
      "basically",
      "actually",
      "you know",
    ]);

    const answerKeywords = tokenizeKeywords(normalizedAnswer);
    const referenceKeywords = tokenizeKeywords(referenceAnswer);
    const matchingKeywords = answerKeywords.filter((word) =>
      referenceKeywords.includes(word)
    ).length;
    const keywordCoverage = referenceKeywords.length
      ? matchingKeywords / referenceKeywords.length
      : 0;

    const checks = Math.max(1, proctoringRef.current.checks);
    const faceVisibilityRatio = proctoringRef.current.faceVisibleChecks / checks;
    const centeredRatio = proctoringRef.current.centeredChecks / checks;
    const warningPenalty = proctoringRef.current.warningsCount * 1.5;
    const fillerPenalty = Math.min(4, fillerCount * 0.8);

    const clarityScore = clampScore(
      4 + Math.min(3, wordCount / 25) + keywordCoverage * 3 - fillerPenalty * 0.4
    );
    const focusScore = clampScore(
      4 + faceVisibilityRatio * 3 + centeredRatio * 2 - warningPenalty * 0.4
    );
    const confidenceScore = clampScore(
      4 + clarityScore * 0.25 + focusScore * 0.35 - fillerPenalty * 0.25
    );
    const nervousnessScore = clampScore(
      3 + fillerPenalty + proctoringRef.current.warningsCount * 1.2
    );
    const knowledgeClarityScore = clampScore(
      4 + keywordCoverage * 4 + Math.min(2, wordCount / 35) - fillerPenalty * 0.3
    );

    return {
      confidenceScore,
      nervousnessScore,
      clarityScore,
      knowledgeClarityScore,
      focusScore,
      indicators: [
        `Face visibility ${(faceVisibilityRatio * 100).toFixed(0)}% during monitoring checks`,
        `Centered on camera ${(centeredRatio * 100).toFixed(0)}% of the time`,
        `Used ${fillerCount} filler words across ${wordCount} words`,
        `Matched ${matchingKeywords} relevant reference keywords`,
      ],
    };
  };

  const buildFallbackEvaluation = (answer, referenceAnswer, deliverySignals) => {
    const normalizedAnswer = String(answer || "").trim();
    const normalizedReference = String(referenceAnswer || "").trim();
    const answerWords = normalizedAnswer.toLowerCase().split(/\s+/).filter(Boolean);
    const referenceWords = normalizedReference.toLowerCase().split(/\s+/).filter(Boolean);
    const referenceKeywords = [...new Set(referenceWords.filter((word) => word.length > 4))];
    const matchedKeywords = referenceKeywords.filter((keyword) =>
      answerWords.includes(keyword)
    );

    const completenessScore = Math.min(3, answerWords.length / 20);
    const keywordScore = referenceKeywords.length
      ? (matchedKeywords.length / referenceKeywords.length) * 4
      : 1.5;
    const deliveryScore =
      (deliverySignals.clarityScore + deliverySignals.confidenceScore + deliverySignals.focusScore) / 10;

    const rating = clampScore(2 + completenessScore + keywordScore + deliveryScore);
    const strengths = [];
    const improvementAreas = [];
    const futureSuggestions = [];
    const scoreReasoning = [];

    if (answerWords.length >= 35) {
      strengths.push("You gave a reasonably detailed answer instead of a one-line response.");
      scoreReasoning.push("Your answer had enough length to communicate your thinking process.");
    } else {
      improvementAreas.push("Your answer was too brief and needs more structure, examples, and supporting detail.");
      scoreReasoning.push("The answer length was short, which reduced evidence of depth and ownership.");
    }

    if (matchedKeywords.length >= 3) {
      strengths.push("You covered relevant technical concepts from the expected answer.");
      scoreReasoning.push("You used several role-relevant or topic-relevant keywords aligned with the question.");
    } else {
      improvementAreas.push("You missed important concepts that the interviewer would expect for this topic.");
      scoreReasoning.push("Key topic coverage was limited, so the answer felt incomplete.");
    }

    if (deliverySignals.clarityScore >= 7) {
      strengths.push("Your explanation was fairly clear and understandable.");
      scoreReasoning.push("Clarity and answer flow supported a better interview impression.");
    } else {
      improvementAreas.push("Your explanation needs a clearer structure: start, reasoning, and conclusion.");
      scoreReasoning.push("Low clarity reduced the effectiveness of an otherwise acceptable answer.");
    }

    if (deliverySignals.confidenceScore >= 7) {
      strengths.push("Your delivery looked more confident and composed.");
    } else {
      improvementAreas.push("Confidence needs improvement through more speaking practice and mock repetitions.");
      scoreReasoning.push("Lower confidence signals affected how strongly the answer came across.");
    }

    if (deliverySignals.focusScore < 6) {
      improvementAreas.push("Maintain stronger eye contact and steadier attention during the interview.");
      scoreReasoning.push("Focus and monitoring signals suggested inconsistent interview presence.");
    }

    futureSuggestions.push("Practice STAR or structured answer patterns so your responses feel more interview-ready.");
    futureSuggestions.push("Revise your role fundamentals and be ready to explain one project end to end.");
    futureSuggestions.push("Practice speaking answers aloud to improve clarity, pacing, and confidence.");

    return {
      rating,
      feedback:
        rating >= 8
          ? "This was a strong answer overall. You showed relevant understanding and decent delivery, though there is still room to sharpen precision."
          : rating >= 6
          ? "This answer has a workable foundation, but it still needs better structure, stronger topic coverage, and more polished delivery to feel interview-ready."
          : "This answer needs more preparation. Focus on fundamentals, clearer explanation, and more confident delivery before relying on this response in a real interview.",
      scoreReasoning: scoreReasoning.slice(0, 5),
      strengths: strengths.slice(0, 5),
      improvementAreas: improvementAreas.slice(0, 5),
      futureSuggestions: futureSuggestions.slice(0, 5),
    };
  };

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (SpeechRecognition) {
      setSpeechReady(true);
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onstart = () => {
        setIsRecording(true);
        shouldKeepListeningRef.current = true;
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript + ' ';
          }
        }

        if (finalTranscript.trim()) {
          setUserAnswer(prev => (prev + ' ' + finalTranscript).trim());
        }

        if (finalTranscript.trim() || interimTranscript.trim()) {
          clearSilenceTimeout();
          silenceTimeoutRef.current = setTimeout(() => {
            if (shouldKeepListeningRef.current && !loadingRef.current && !interviewTerminatedRef.current) {
              stopRecognition(false);
            }
          }, 4500);
        }
      };

      recognition.onerror = (event) => {
        if (!["aborted", "no-speech"].includes(event.error)) {
          toast.error(`Speech recognition error: ${event.error}`);
        }
        if (event.error === "not-allowed") {
          shouldKeepListeningRef.current = false;
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        clearSilenceTimeout();
        if (
          shouldKeepListeningRef.current &&
          webcamEnabledRef.current &&
          !interviewTerminatedRef.current &&
          !loadingRef.current &&
          !isGeneratingQuestionRef.current &&
          !isQuestionBeingSpokenRef.current
        ) {
          setTimeout(() => startRecognition({ automatic: true }), 300);
        }
      };
    }
    else {
      setSpeechReady(false);
    }
    return () => {
      shouldKeepListeningRef.current = false;
      clearSilenceTimeout();
      try {
        recognitionRef.current?.stop();
      } catch (error) {
        console.error("Speech recognition cleanup error:", error);
      }
    };
  }, []);

  useEffect(() => {
    emitProctoringUpdate();
  }, [micReady, speechReady, visionSupported, monitoringSupported]);

  useEffect(() => {
    const videoElement = webcamRef.current;

    if (!videoElement || !webcamStream) {
      return;
    }

    videoElement.srcObject = webcamStream;
    videoElement
      .play()
      .catch((error) => console.error("Video playback error:", error));
  }, [webcamStream]);

  useEffect(() => {
    return () => {
      webcamStream?.getTracks()?.forEach((track) => track.stop());
      audioStreamRef.current?.getTracks()?.forEach((track) => track.stop());
      clearSilenceTimeout();
    };
  }, [webcamStream]);

  useEffect(() => {
    setUserAnswer("");
    setCodingAnswer(String(currentPrompt?.starterCode || ""));
    setSelectedLanguage(currentPrompt?.codingLanguage || "javascript");
    lastAutoStartedQuestionRef.current = -1;
    shouldKeepListeningRef.current = false;
    handledTimerExpiryRef.current = false;
    clearSilenceTimeout();
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error("Speech recognition reset error:", error);
    }
  }, [activeQuestionIndex, currentPrompt?.starterCode, currentPrompt?.codingLanguage]);

  useEffect(() => {
    if (
      !webcamEnabled ||
      !speechReady ||
      interviewTerminated ||
      loading ||
      isGeneratingQuestion ||
      isQuestionBeingSpoken
    ) {
      if (isQuestionBeingSpoken || isGeneratingQuestion || interviewTerminated) {
        shouldKeepListeningRef.current = false;
        clearSilenceTimeout();
        try {
          recognitionRef.current?.stop();
        } catch (error) {
          console.error("Speech recognition pause error:", error);
        }
      }
      return;
    }

    if (lastAutoStartedQuestionRef.current === activeQuestionIndex) {
      return;
    }

    const timer = setTimeout(() => {
      const started = startRecognition({ automatic: true });
      if (started) {
        lastAutoStartedQuestionRef.current = activeQuestionIndex;
        toast.success("Live voice capture started. Speak naturally.");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    activeQuestionIndex,
    webcamEnabled,
    speechReady,
    interviewTerminated,
    loading,
    isGeneratingQuestion,
    isQuestionBeingSpoken,
  ]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden && !interviewTerminated) {
        proctoringRef.current.hiddenTabEvents += 1;
        issueWarning("You switched tabs or minimized the interview window. Please stay focused on the interview.");
      }
    };

    const handleWindowBlur = () => {
      if (!interviewTerminated) {
        issueWarning("The interview window lost focus. Please return and avoid using other tabs or apps.");
      }
    };

    const handleMouseLeave = (event) => {
      if (!interviewTerminated && event.clientY <= 0) {
        issueWarning("Please keep your attention on the interview window.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [interviewTerminated, webcamEnabled]);

  useEffect(() => {
    if (!webcamEnabled || !webcamStream || interviewTerminated) {
      if (proctoringIntervalRef.current) {
        clearInterval(proctoringIntervalRef.current);
        proctoringIntervalRef.current = null;
      }
      if (!webcamEnabled && !interviewTerminated) {
        applyViolationState("camera_off");
      }
      return;
    }

    if (typeof window === "undefined" || typeof window.FaceDetector === "undefined") {
      setMonitoringSupported(false);
      setVisionSupported(false);
      applyViolationState("limited_browser_support");
      onProctoringUpdate?.({
        ...proctoringRef.current,
        monitoringSupported: true,
        visionSupported: false,
      });
      return;
    }

    setMonitoringSupported(true);
    setVisionSupported(true);
    applyViolationState("normal");
    onProctoringUpdate?.({
      ...proctoringRef.current,
      monitoringSupported: true,
      visionSupported: true,
    });
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });

    const runDetection = async () => {
      const video = webcamRef.current;
      if (!video || video.readyState < 2 || interviewTerminated) {
        return;
      }

      try {
        const faces = await detector.detect(video);
        proctoringRef.current.checks += 1;
        let nextViolation = "normal";

        if (faces.length === 0) {
          proctoringRef.current.noFaceEvents += 1;
          nextViolation = "no_face";
          issueWarning("Your face is not clearly visible. Please stay in front of the camera.");
        } else {
          proctoringRef.current.faceVisibleChecks += 1;
          const primaryFace = faces[0].boundingBox;
          const centerX = primaryFace.x + primaryFace.width / 2;
          const videoWidth = video.videoWidth || 1;
          const centered = centerX > videoWidth * 0.25 && centerX < videoWidth * 0.75;

          if (centered) {
            proctoringRef.current.centeredChecks += 1;
          } else {
            proctoringRef.current.offCenterEvents += 1;
            nextViolation = "off_center";
            issueWarning("Please keep your face centered like a real interview setting.");
          }
        }

        if (faces.length > 1) {
          proctoringRef.current.multipleFaceEvents += 1;
          nextViolation = "multiple_faces";
          issueWarning("Multiple faces were detected. Only the candidate should remain in frame.");
        }

        applyViolationState(nextViolation);
        emitProctoringUpdate();
      } catch (error) {
        console.error("Face detection error:", error);
      }
    };

    proctoringIntervalRef.current = setInterval(runDetection, 2500);

    return () => {
      if (proctoringIntervalRef.current) {
        clearInterval(proctoringIntervalRef.current);
        proctoringIntervalRef.current = null;
      }
    };
  }, [webcamEnabled, webcamStream, interviewTerminated, monitoringSupported, onProctoringUpdate]);

  const EnableWebcam = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });
      audioStreamRef.current = audioStream;
      setMicReady(audioStream.getAudioTracks().length > 0);
      setWebcamStream(stream);
      setWebcamEnabled(true);
      toast.success("Webcam enabled successfully");
    } catch (error) {
      setMicReady(false);
      toast.error("Failed to enable webcam", {
        description: "Please check your camera and microphone permissions"
      });
      console.error("Webcam error:", error);
    }
  };

  const DisableWebcam = () => {
    if (!interviewTerminated) {
      applyViolationState("camera_off");
      issueWarning("Webcam was disabled during the interview. Please keep the camera on.");
    }
    shouldKeepListeningRef.current = false;
    stopRecognition(false);
    webcamStream?.getTracks()?.forEach((track) => track.stop());
    audioStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    audioStreamRef.current = null;
    if (webcamRef.current) {
      webcamRef.current.srcObject = null;
    }
    setWebcamStream(null);
    setWebcamEnabled(false);
    setMicReady(false);
  };

  useEffect(() => {
    if (
      autoStartAttemptedRef.current ||
      webcamEnabled ||
      interviewTerminated ||
      loading ||
      isGeneratingQuestion
    ) {
      return;
    }

    autoStartAttemptedRef.current = true;
    EnableWebcam();
  }, [webcamEnabled, interviewTerminated, loading, isGeneratingQuestion]);

  const StartStopRecording = () => {
    if (!recognitionRef.current) {
      setSpeechReady(false);
      toast.error("Speech-to-text not supported");
      return;
    }

    if (isRecording) {
      shouldKeepListeningRef.current = false;
      stopRecognition(false);
      toast.info("Recording stopped");
    } else {
      const started = startRecognition({ automatic: false });
      if (started) {
        toast.info("Recording started");
      }
    }
  };

  const UpdateUserAnswer = async (forceSkip = false) => {
    // (previous answer saving logic remains the same)
    if (interviewTerminated) {
      toast.error("Interview has been terminated.");
      return;
    }

    if (!webcamEnabled) {
      toast.error("Please enable your webcam before answering.");
      return;
    }

    if (hasBlockingViolation()) {
      toast.error(proctoringRef.current.currentViolationLabel || "Active camera violation", {
        description:
          proctoringRef.current.currentViolationReason ||
          "Return to a valid camera state before saving your answer.",
      });
      return;
    }

    const hasCandidateContent = Boolean(userAnswer.trim() || (isCodingQuestion && codingAnswer.trim()));

    if (!hasCandidateContent && !forceSkip) {
      toast.error("Please provide an answer");
      return;
    }

    setLoading(true);

    try {
      const finalAnswer = forceSkip && !hasCandidateContent
        ? "I don't know"
        : isCodingQuestion
        ? [
            userAnswer.trim() ? `Approach:\n${userAnswer.trim()}` : "",
            codingAnswer.trim() ? `Code (${selectedLanguage}):\n${codingAnswer.trim()}` : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        : userAnswer;
      const feedbackPrompt = `Question: ${mockInterviewQuestion[activeQuestionIndex]?.question}
User answer: ${finalAnswer}
Reference answer: ${mockInterviewQuestion[activeQuestionIndex]?.answer}

Score the answer briefly and return JSON only:
{
  "rating": number,
  "feedback": "2-3 sentence summary of the evaluation",
  "scoreReasoning": [
    "reason 1 behind the score",
    "reason 2 behind the score",
    "reason 3 behind the score",
    "reason 4 behind the score"
  ],
  "strengths": [
    "what the user did well",
    "another strength"
  ],
  "improvementAreas": [
    "specific area to improve",
    "another area to improve"
  ],
  "futureSuggestions": [
    "practical next step for future interviews",
    "another actionable suggestion"
  ]
}
No markdown. If answer is blank or "I don't know", give low score and mention missing fundamentals.`;
      
      const deliverySignals = buildDeliverySignals(
        finalAnswer,
        mockInterviewQuestion[activeQuestionIndex]?.answer
      );
      let JsonfeedbackResp;

      try {
        const responseText = await sendGeminiPrompt(feedbackPrompt);
        JsonfeedbackResp = extractJsonFromText(responseText);
      } catch (error) {
        if (!isGeminiRetryableError(error)) {
          throw error;
        }

        JsonfeedbackResp = buildFallbackEvaluation(
          finalAnswer,
          mockInterviewQuestion[activeQuestionIndex]?.answer,
          deliverySignals
        );
        const errorMessage = String(error?.message || "").toLowerCase();
        toast.info(
          errorMessage.includes("timed out") || errorMessage.includes("took too long")
            ? "AI response timed out, using built-in interview evaluator."
            : "AI scoring was unavailable, using built-in interview evaluator."
        );
      }

      const normalizedFeedback = {
        feedback:
          JsonfeedbackResp?.feedback ||
          "No detailed feedback was generated.",
        scoreReasoning: Array.isArray(JsonfeedbackResp?.scoreReasoning)
          ? JsonfeedbackResp.scoreReasoning.slice(0, 5)
          : [],
        strengths: Array.isArray(JsonfeedbackResp?.strengths)
          ? JsonfeedbackResp.strengths.slice(0, 5)
          : [],
        improvementAreas: Array.isArray(JsonfeedbackResp?.improvementAreas)
          ? JsonfeedbackResp.improvementAreas.slice(0, 5)
          : [],
        futureSuggestions: Array.isArray(JsonfeedbackResp?.futureSuggestions)
          ? JsonfeedbackResp.futureSuggestions.slice(0, 5)
          : [],
        deliverySignals,
        proctoring: {
          warningsCount: proctoringRef.current.warningsCount,
          hiddenTabEvents: proctoringRef.current.hiddenTabEvents,
          noFaceEvents: proctoringRef.current.noFaceEvents,
          multipleFaceEvents: proctoringRef.current.multipleFaceEvents,
          offCenterEvents: proctoringRef.current.offCenterEvents,
          monitoringSupported,
        },
      };

      const answerRecord = {
        mockIdRef: interviewData?.mockId,
        question: mockInterviewQuestion[activeQuestionIndex]?.question,
        correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
        userAns: finalAnswer,
        feedback: JSON.stringify(normalizedFeedback),
        rating: String(JsonfeedbackResp?.rating ?? ""),
        createdAt: formatLegacyInterviewDate(),
      };

      const response = await fetch(`/api/interviews/${interviewData?.mockId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(answerRecord),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save answer.");
      }

      await onAnswerSave?.(answerRecord, normalizedFeedback);

      toast.success("Answer recorded successfully");
      
      setUserAnswer("");
      shouldKeepListeningRef.current = false;
      stopRecognition(false);
    } catch (error) {
      toast.error("Failed to save answer", {
        description: error.message
      });
      console.error("Answer save error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !questionTimerExpired ||
      handledTimerExpiryRef.current ||
      hasBlockingViolation() ||
      loading ||
      interviewTerminated ||
      isGeneratingQuestion
    ) {
      return;
    }

    handledTimerExpiryRef.current = true;
    const hasDraftContent = Boolean(userAnswer.trim() || (isCodingQuestion && codingAnswer.trim()));
    toast.error("Time is up", {
      description: hasDraftContent
        ? "Submitting your current response automatically."
        : "No response was submitted in time, so this round will be marked as skipped.",
    });
    UpdateUserAnswer(!hasDraftContent);
  }, [
    questionTimerExpired,
    loading,
    interviewTerminated,
    isGeneratingQuestion,
    userAnswer,
    codingAnswer,
    isCodingQuestion,
    proctoringState?.currentViolation,
  ]);

  return (
    <div className="relative flex w-full flex-col">
      {loading && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex flex-col justify-center items-center">
          <Loader2 className="h-16 w-16 animate-spin text-white mb-4" />
          <p className="text-white text-lg">Saving your answer...</p>
        </div>
      )}
      {proctoringState?.currentViolation &&
        proctoringState.currentViolation !== "normal" &&
        proctoringState.currentViolation !== "limited_browser_support" && (
        <div
          className={`mb-4 rounded-xl border p-4 text-sm ${
            CAMERA_BLOCKING_VIOLATIONS.has(proctoringState.currentViolation)
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">
            {proctoringState.currentViolationLabel || "Monitoring warning"}
          </p>
          <p className="mt-1">
            {proctoringState.currentViolationReason ||
              "Adjust your interview setup to continue smoothly."}
          </p>
        </div>
      )}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Candidate Preview</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">Camera and voice controls</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {isRecording ? "Mic Live" : speechReady ? "Mic Armed" : "Ready"}
          </span>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${micReady ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            {micReady ? "Mic permission granted" : "Mic permission pending"}
          </span>
        </div>

        <div className="w-full rounded-2xl border border-slate-800 bg-black p-4 shadow-xl">
        {webcamEnabled ? (
          <div className="relative">
            <video 
              ref={webcamRef} 
              autoPlay 
              playsInline 
              muted
              className="h-auto w-full rounded-xl object-cover scale-x-[-1] aspect-[4/3] bg-slate-900"
            />
            {showOverlayViolation && (
              <div
                className={`absolute inset-x-3 top-3 rounded-xl border px-4 py-2.5 text-sm shadow-lg backdrop-blur ${
                  CAMERA_BLOCKING_VIOLATIONS.has(proctoringState.currentViolation)
                    ? "border-red-300 bg-red-950/85 text-white"
                    : "border-amber-300 bg-amber-950/85 text-amber-50"
                }`}
              >
                <p className="font-semibold">
                  {proctoringState.currentViolationLabel || "Monitoring warning"}
                </p>
                <p className="mt-1 text-xs sm:text-sm">
                  {proctoringState.currentViolationReason ||
                    "Please adjust your position to continue the interview."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-slate-200">
            <p className="text-gray-500">Webcam Disabled</p>
          </div>
        )}
        
        <Button
          variant="outline"
          className="mt-3 w-full sm:w-auto"
          onClick={webcamEnabled ? DisableWebcam : EnableWebcam}
          disabled={interviewTerminated}
        >
          {webcamEnabled ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" /> Disable Webcam
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" /> Retry Camera Access
            </>
          )}
        </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <ClipboardPenLine className="h-5 w-5 text-slate-700" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Answer Workspace</h3>
            <p className="text-xs text-slate-500 sm:text-sm">
              {isCodingQuestion
                ? "Use the explanation box for your approach and the coding editor for your solution. Keep both concise and interview-ready."
                : "Voice capture stays armed automatically for every question so you can answer without manually turning the mic on."}
            </p>
          </div>
        </div>

        <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
          <div className={`rounded-2xl border px-4 py-2.5 ${questionTimerExpired ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-800"}`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <Clock3 className="h-4 w-4" />
              Time Left
            </div>
            <p className="mt-1.5 text-base font-semibold">{formatTime(questionTimeLeft)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <Code2 className="h-4 w-4" />
              Mode
            </div>
            <p className="mt-1.5 text-base font-semibold capitalize">{isCodingQuestion ? "Coding" : "Theory"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Difficulty</p>
            <p className="mt-1.5 text-base font-semibold capitalize">{currentPrompt?.difficulty || "medium"}</p>
          </div>
        </div>

        <Button
          disabled={loading || interviewTerminated || isGeneratingQuestion}
          variant="outline"
          className="mb-4 w-full sm:w-fit"
          onClick={StartStopRecording}
        >
          {isRecording ? (
            <h2 className="flex items-center gap-2 text-red-600 animate-pulse">
              <StopCircle /> Stop Recording
            </h2>
          ) : (
            <h2 className="text-primary flex gap-2 items-center">
              <Mic /> Start Manual Recording
            </h2>
          )}
        </Button>

        <textarea
          className="mt-1 h-36 w-full rounded-2xl border border-slate-200 p-4 text-gray-800"
          placeholder={isCodingQuestion ? "Briefly explain your approach, edge cases, and complexity..." : "Your answer will appear here..."}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={interviewTerminated || isGeneratingQuestion}
        />

        {isCodingQuestion && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Coding Workspace</h4>
                <p className="text-sm text-slate-500">
                  Professional, precise editor for solving the current coding prompt.
                </p>
              </div>
              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                disabled={interviewTerminated || isGeneratingQuestion}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <textarea
              className="mt-4 h-72 w-full rounded-2xl border border-slate-300 bg-slate-950 p-4 font-mono text-sm text-slate-100 outline-none"
              placeholder="Write your code here..."
              value={codingAnswer}
              onChange={(event) => setCodingAnswer(event.target.value)}
              disabled={interviewTerminated || isGeneratingQuestion}
              spellCheck={false}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => UpdateUserAnswer(false)}
            disabled={
              loading ||
              (!userAnswer.trim() && !(isCodingQuestion && codingAnswer.trim())) ||
              interviewTerminated ||
              isGeneratingQuestion ||
              CAMERA_BLOCKING_VIOLATIONS.has(proctoringState?.currentViolation)
            }
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              "Save Answer"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => UpdateUserAnswer(true)}
            disabled={loading || interviewTerminated || isGeneratingQuestion}
          >
            I Don't Know
          </Button>
        </div>
        {CAMERA_BLOCKING_VIOLATIONS.has(proctoringState?.currentViolation) && (
          <p className="mt-3 text-sm font-medium text-red-700">
            {proctoringState?.currentViolationReason || "Return to a valid camera state to continue and save your answer."}
          </p>
        )}
        {questionTimerExpired && (
          <p className="mt-3 text-sm font-medium text-red-700">
            This question's time window has ended. Your response is being submitted automatically.
          </p>
        )}
      </div>
    </div>
  );
};

export default RecordAnswerSection;
