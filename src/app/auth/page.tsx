"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "@/components/auth/LoginForm";
import TwoStepRegisterForm from "@/components/auth/TwoStepRegisterForm";
import { getBaseUrl } from "@/lib/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const handleAuthSuccess = () => {
    // Redirect to dashboard or home page using environment-aware URL
    window.location.href = `${getBaseUrl()}/`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-tertiary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Welcome
          </h1>
          <p className="text-[var(--text-secondary)]">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LoginForm
                onSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setIsLogin(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TwoStepRegisterForm
                onSuccess={handleAuthSuccess}
                onSwitchToLogin={() => setIsLogin(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
