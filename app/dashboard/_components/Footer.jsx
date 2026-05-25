import React from "react";
import Link from "next/link";
import { Bot, CopyrightIcon, Github, Linkedin, Mail, MapPin } from "lucide-react";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "AI Preparation", href: "/ai-preparation" },
      { label: "Resume Analysis", href: "/resume-analysis" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about-us" },
      { label: "Home", href: "/" },
      { label: "Skill Assessment", href: "/skill-assessment" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Email support", href: "mailto:amansharma881023@gmail.com" },
      { label: "Contact team", href: "mailto:amansharma881023@gmail.com" },
      { label: "Interview reports", href: "/dashboard" },
    ],
  },
];



const teamMembers = [
  {
    name: "Aman Sharma",
    github: "https://github.com/23Amansharma",
    linkedin: "https://www.linkedin.com/in/aman-sharma-4aa314251/",
    email: "2000amitkumarsharma@gmail.com",
  },
  {
    name: "Alok Gupta",
    github: "https://github.com/mrinvictus2005",
    linkedin: "https://www.linkedin.com/in/alokgupta2005/",
    email: "alokgupta49849@gmail.com",
  },
];

const Footer = () => {
  return (
    <footer className="mt-12 w-full border-t border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-white">
      <div className="w-full px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 xl:grid-cols-[1.25fr_0.75fr_0.75fr_0.9fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-[0_14px_30px_rgba(59,130,246,0.3)]">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">Intivolution AI</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Interview Intelligence
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              Professional AI interview preparation with adaptive mock rounds, resume-aware insights, live monitoring, and concise downloadable reports built for serious candidates.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-indigo-300" />
                <a href="mailto:alokgupta49849@gmail.com" className="transition hover:text-white">
                  alokgupta49849@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-indigo-300" />
                <span>India</span>
              </div>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                {group.title}
              </h3>
              <div className="mt-5 space-y-3">
                {group.links.map((link) => {
                  const isInternal = link.href.startsWith("/");
                  return isInternal ? (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block text-sm text-slate-300 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      className="block text-sm text-slate-300 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom Bar ── */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

            {/* Left: Copyright + Team credits */}
            <div className="space-y-3">
              <div className="flex items-center text-sm text-slate-400">
                <CopyrightIcon className="mr-2 h-4 w-4" />
                <span>{new Date().getFullYear()} Intivolution AI. All rights reserved.</span>
              </div>

              {/* Made by — Members */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Made with ♥ by</p>
                {teamMembers.map((member) => (
                  <div key={member.name} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">{member.name}</span>
                    <span className="text-slate-700">·</span>
                    {/* GitHub */}
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-slate-500 transition hover:text-white"
                    >
                      <Github className="h-3 w-3" />
                      GitHub
                    </a>
                    <span className="text-slate-700">·</span>
                    {/* LinkedIn */}
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-slate-500 transition hover:text-white"
                    >
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </a>
                    <span className="text-slate-700">·</span>
                    {/* Email */}
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-1 text-slate-500 transition hover:text-white"
                    >
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: placeholder for future social links */}
            <div />

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
