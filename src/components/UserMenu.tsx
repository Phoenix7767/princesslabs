"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, getAvatarUrl, logout } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-6 py-3 bg-[var(--bg-tertiary)] shadow-lg z-50">
      <Link
        href="/"
        className="text-xl font-bold text-[var(--text-primary)] hover:text-[var(--pink-secondary)] transition-colors"
      >
        PrincessLabs
      </Link>

      {!loading && (
        <div className="relative" ref={menuRef}>
          {user ? (
            <>
              <button
                className="flex items-center gap-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] px-3 py-1 rounded-full shadow hover:shadow-lg transition-all"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <img
                  src={getAvatarUrl(user)}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-medium text-[var(--text-primary)]">
                  {user.display_name}
                </span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-[var(--bg-primary)] rounded-xl shadow-lg p-2 z-50"
                  >
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/settings");
                      }}
                    >
                      Settings
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--error)] transition-colors"
                      onClick={async () => {
                        setMenuOpen(false);
                        await logout();
                        setUser(null);
                        router.push("/auth");
                      }}
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <Link
              href="/auth"
              className="bg-[var(--pink-primary)] hover:bg-[var(--pink-secondary)] text-white font-medium py-2 px-4 rounded-full transition-colors duration-200 shadow hover:shadow-lg"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
