"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bot } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

function Header() {
  const path = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const controlNavbar = useCallback(() => {
    if (typeof window !== "undefined") {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    }
  }, [lastScrollY]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar);
      return () => window.removeEventListener("scroll", controlNavbar);
    }
  }, [controlNavbar]);

  useEffect(() => {
    closeMobileMenu();
  }, [path]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    
    // Prevent body scrolling when menu is open
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'unset';
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/ai-preparation", label: "AI Preparation" },
    { href: "/resume-analysis", label: "Resume Analysis" },
    { href: "/about-us", label: "About us" },
  ];

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 
          bg-white/90 backdrop-blur-md 
          border-b border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.08)] z-50 
          transition-all duration-300 ease-in-out
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="flex w-full items-center justify-between gap-4 px-3 py-4 sm:px-5 lg:px-6">
          <Link 
            href="/" 
            className="flex items-center gap-3"
            aria-label="Intivolution AI Home"
            onClick={closeMobileMenu}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-[0_14px_30px_rgba(59,130,246,0.32)]">
              <Bot size={24} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[1.9rem] font-black tracking-[-0.045em] text-slate-950 sm:text-[2.05rem]">Intivolution AI</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-400">Interview Intelligence</span>
            </div>
          </Link>

          <nav 
            className="hidden items-center gap-2 md:flex"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                path={path}
                href={item.href}
                label={item.label}
                onClick={closeMobileMenu}
              />
            ))}
          </nav>

          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="rounded-xl border border-slate-200 bg-white p-2 text-gray-600 transition-colors hover:text-indigo-600 focus:outline-none"
              aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="hidden md:flex md:items-center md:gap-3">
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="
            fixed inset-0 top-0 
            bg-white z-40 md:hidden 
            overflow-hidden
            pt-16
          "
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div className="h-full overflow-y-auto pb-16">
            <nav className="space-y-6 p-6">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  path={path}
                  href={item.href}
                  label={item.label}
                  mobile
                  onClick={closeMobileMenu}
                />
              ))}

              {/* Mobile Authentication */}
              <div className="pt-6 border-t">
                <SignedOut>
                  <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
                    <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">
                      Sign In To Continue
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center justify-end rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function NavItem({ path, href, label, mobile, onClick }) {
  const normalizedHref = href.split("#")[0] || "/";
  const isHomeLink = normalizedHref === "/";
  const hasHashTarget = href.includes("#");
  const isActive = hasHashTarget
    ? false
    : isHomeLink
      ? path === "/"
      : path === normalizedHref || path.startsWith(`${normalizedHref}/`);

  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`
        block 
        transition-all duration-300 ease-in-out 
        cursor-pointer 
        rounded-full 
        focus:outline-none 
        focus:ring-2 
        focus:ring-indigo-500
        ${mobile
          ? "w-full text-lg py-3 text-center"
          : "px-4 py-2 text-[15px] font-semibold tracking-[-0.015em] hover:text-indigo-600"
        }
        ${isActive
          ? "text-indigo-700"
          : "text-slate-600 hover:text-indigo-600"
        }
      `}
    >
      <span className="relative inline-block">
        {label}
        {!mobile && isActive && (
          <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-indigo-600" />
        )}
      </span>
    </Link>
  );
}

export default Header;
