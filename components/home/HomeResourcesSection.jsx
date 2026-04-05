"use client";

import { useState } from "react";
import {
  ArrowRight,
  Award,
  Book,
  Brain,
  Code,
  FileSearch,
  FileText,
  Globe,
  PenTool,
  Sparkles,
  Target,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import ResumeAnalyzerSection from "@/components/resume/ResumeAnalyzerSection";

const ResourceCard = ({ icon, title, description, links }) => (
  <div className="h-full rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_26px_60px_rgba(15,23,42,0.12)]">
    <div className="mb-4 flex items-center">
      {icon}
      <h3 className="ml-4 text-xl font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="mb-4 flex-grow text-gray-600">{description}</p>
    <div className="space-y-2">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center text-indigo-600 transition-colors hover:text-indigo-800"
        >
          {link.name}
          <ArrowRight className="ml-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      ))}
    </div>
  </div>
);

export default function HomeResourcesSection() {
  const [activeCategory, setActiveCategory] = useState("tech");

  const resourceCategories = {
    tech: {
      resources: [
        {
          title: "Coding Platforms",
          description: "Practice coding and algorithmic problem-solving",
          icon: <Code className="h-8 w-8 text-indigo-600" />,
          links: [
            { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/" },
            { name: "LeetCode", url: "https://leetcode.com/" },
            { name: "HackerRank", url: "https://www.hackerrank.com/" },
            { name: "CodeChef", url: "https://www.codechef.com/" },
          ],
        },
        {
          title: "Technical Interview Preparation",
          description: "Resources for system design and technical interviews",
          icon: <Target className="h-8 w-8 text-indigo-600" />,
          links: [
            { name: "InterviewBit", url: "https://www.interviewbit.com/" },
            { name: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
            { name: "Pramp", url: "https://www.pramp.com/" },
          ],
        },
      ],
    },
    aptitude: {
      resources: [
        {
          title: "Aptitude & Reasoning",
          description: "Practice quantitative and logical reasoning skills",
          icon: <PenTool className="h-8 w-8 text-indigo-600" />,
          links: [
            { name: "IndiaBix", url: "https://www.indiabix.com/" },
            { name: "Freshersworld Aptitude", url: "https://www.freshersworld.com/aptitude-questions" },
            { name: "MathsGuru Reasoning", url: "https://www.mathsguru.com/reasoning-questions/" },
          ],
        },
        {
          title: "Competitive Exam Prep",
          description: "Resources for competitive and placement exams",
          icon: <Award className="h-8 w-8 text-indigo-600" />,
          links: [
            { name: "GATE Overflow", url: "https://gateoverflow.in/" },
            { name: "Career Power", url: "https://careerpower.in/" },
            { name: "Brilliant.org", url: "https://brilliant.org/" },
          ],
        },
      ],
    },
    interview: {
      resources: [
        {
          title: "Interview Guides",
          description: "Comprehensive interview preparation resources",
          icon: <Book className="h-8 w-8 text-indigo-600" />,
          links: [
            { name: "Insider Tips", url: "https://www.ambitionbox.com/" },
            { name: "InterviewStreet", url: "https://www.interviewstreet.com/" },
            { name: "Career Guidance", url: "https://www.shiksha.com/" },
          ],
        },
        {
          title: "Global Learning Platforms",
          description: "Online courses and learning resources",
          icon: <Globe className="h-8 w-8 text-indigo-600" />,
          links: [
            { name: "Coursera", url: "https://www.coursera.org/" },
            { name: "edX", url: "https://www.edx.org/" },
            { name: "Udacity", url: "https://www.udacity.com/" },
          ],
        },
      ],
    },
    resume: {
      resources: [
        {
          title: "ATS Resume Optimization",
          description: "Improve ATS matching, keywords, summaries, and bullet quality.",
          icon: <Sparkles className="h-8 w-8 text-indigo-600" />,
          links: [
            { name: "Resume Worded", url: "https://resumeworded.com/" },
            { name: "Jobscan Blog", url: "https://www.jobscan.co/blog/" },
            { name: "Harvard Resume Guide", url: "https://careerservices.fas.harvard.edu/resources/bullet-point-resume-template/" },
          ],
        },
        {
          title: "Professional Resume Strategy",
          description: "Learn how to rewrite summaries, metrics, and role targeting more effectively.",
          icon: <Target className="h-8 w-8 text-indigo-600" />,
          links: [
            { name: "Indeed Resume Tips", url: "https://www.indeed.com/career-advice/resumes-cover-letters" },
            { name: "The Muse Resume Guide", url: "https://www.themuse.com/advice/resume-tips" },
            { name: "TopResume Advice", url: "https://www.topresume.com/career-advice" },
          ],
        },
      ],
    },
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_28%,#f8fafc_100%)] py-16">
      <div className="w-full px-2.5 sm:px-4 lg:px-5">
        <ScrollReveal className="mb-16 space-y-4 text-center">
          <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Interview & Preparation Resources
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 md:text-xl">
            Comprehensive collection of resources to support your professional growth and interview preparation
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100} className="mb-12 flex flex-wrap justify-center gap-4">
          {Object.keys(resourceCategories).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeCategory === category
                  ? "bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]"
                  : "border border-slate-200 bg-white text-gray-900 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {category === "resume"
                ? "Resume Analyzer"
                : `${category.charAt(0).toUpperCase() + category.slice(1)} Resources`}
            </button>
          ))}
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-2">
          {resourceCategories[activeCategory].resources.map((resource, index) => (
            <ScrollReveal key={resource.title} delay={index * 100} direction={index % 2 === 0 ? "up" : "left"}>
              <ResourceCard {...resource} />
            </ScrollReveal>
          ))}
        </div>

        {activeCategory === "resume" && (
          <ScrollReveal delay={120} className="mt-10">
            <ResumeAnalyzerSection
              compact
              title="Resume upload and ATS analysis"
              subtitle="Analyze your resume right here, get a realistic ATS score, and open a detailed AI report with role-specific improvements."
            />
          </ScrollReveal>
        )}

        <ScrollReveal delay={140} className="mt-16 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="p-8 text-center md:p-12">
            <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
              Additional Preparation Tips
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-gray-600">
              Explore supplementary resources to enhance your interview and career preparation journey
            </p>
          </div>
          <div className="grid gap-6 p-8 pt-0 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Resume Building",
                description: "Create a standout professional resume",
                icon: <Book className="mx-auto mb-4 h-12 w-12 text-indigo-600" />,
                url: "https://www.canva.com/resumes/templates/",
              },
              {
                title: "Mock Interviews",
                description: "Practice with AI-powered interview simulations",
                icon: <Target className="mx-auto mb-4 h-12 w-12 text-green-600" />,
                url: "/dashboard",
              },
              {
                title: "Resume Analyzer",
                description: "Generate ATS score and personalized improvement report",
                icon: <FileSearch className="mx-auto mb-4 h-12 w-12 text-indigo-600" />,
                url: "/resume-analysis",
              },
              {
                title: "Skill Assessment",
                description: "Identify and improve your key skills",
                icon: <Brain className="mx-auto mb-4 h-12 w-12 text-purple-600" />,
                url: "/skill-assessment",
              },
            ].map((tip, index) => (
              <ScrollReveal key={tip.title} delay={index * 90} direction="up">
                <div className="group rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-center transition-all hover:-translate-y-2 hover:shadow-md">
                  {tip.icon}
                  <h3 className="mb-4 text-xl font-semibold text-gray-900">{tip.title}</h3>
                  <p className="mb-4 text-gray-600">{tip.description}</p>
                  <a
                    href={tip.url}
                    target={tip.url.startsWith("/") ? "_self" : "_blank"}
                    rel={tip.url.startsWith("/") ? undefined : "noopener noreferrer"}
                    className="flex items-center justify-center text-indigo-600 group-hover:text-indigo-800"
                  >
                    Explore
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
