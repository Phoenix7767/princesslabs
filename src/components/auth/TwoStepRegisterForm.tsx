"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/auth";

interface TwoStepRegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function TwoStepRegisterForm({
  onSuccess,
  onSwitchToLogin,
}: TwoStepRegisterFormProps) {
  // Step 1 state
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Step 2 state
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");

  // Step 1: Register with Supabase Auth
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    // Check if username exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .single();
    if (existingUser) {
      setError("Username already exists");
      setIsLoading(false);
      return;
    }
    // Register
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }
    if (!authData.user) {
      setError("Failed to create user");
      setIsLoading(false);
      return;
    }
    setUserId(authData.user.id);
    setPendingEmail(email);
    // If session is available, go to next step. If not, show email confirm screen.
    if (authData.session) {
      setStep(3);
    } else {
      setStep(2);
      // Start polling for session
      pollForSession();
    }
    setIsLoading(false);
  };

  // Poll for session after email confirmation
  const pollForSession = async () => {
    let attempts = 0;
    let session = (await supabase.auth.getSession()).data.session;
    while (!session && attempts < 60) {
      // up to ~60s
      await new Promise((res) => setTimeout(res, 1000));
      session = (await supabase.auth.getSession()).data.session;
      attempts++;
    }
    if (session) {
      setStep(3);
    }
  };

  // Step 2: Update profile and upload avatar
  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (!userId) {
      setError("User ID missing. Please try again.");
      setIsLoading(false);
      return;
    }
    // Wait for profile row to exist
    let profile: User | null = null;
    let attempts = 0;
    while (!profile && attempts < 15) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (userProfile) profile = userProfile;
      else await new Promise((res) => setTimeout(res, 300));
      attempts++;
    }
    if (!profile) {
      setError("Profile creation failed. Please try again.");
      setIsLoading(false);
      return;
    }
    // Update display name
    if (displayName && displayName !== profile.display_name) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ display_name: displayName })
        .eq("id", userId);
      if (updateError) {
        setError("Failed to update display name");
        setIsLoading(false);
        return;
      }
    }
    // Upload avatar if provided
    if (avatar) {
      let session = (await supabase.auth.getSession()).data.session;
      let sessionAttempts = 0;
      while (!session && sessionAttempts < 10) {
        await new Promise((res) => setTimeout(res, 200));
        session = (await supabase.auth.getSession()).data.session;
        sessionAttempts++;
      }
      if (!session) {
        setError("Could not verify authentication for avatar upload.");
        setIsLoading(false);
        return;
      }
      const fileExt = avatar.name.split(".").pop();
      const fileName = `${userId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatar, { upsert: true });
      if (uploadError) {
        setError("Failed to upload avatar. You can update it later.");
        setIsLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      const avatarUrl = urlData.publicUrl;
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);
      if (updateError) {
        setError(
          "Avatar uploaded, but failed to update profile. You can update it later."
        );
        setIsLoading(false);
        return;
      }
    }
    setIsLoading(false);
    onSuccess();
  };

  // Avatar preview logic
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleAvatarClick = () => fileInputRef.current?.click();
  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-[var(--bg-primary)] shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-[var(--text-primary)]">
          Register
        </h2>
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                placeholder="Enter your password (min 6 characters)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                placeholder="Re-enter your password"
              />
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[var(--error)] text-sm text-center bg-[var(--bg-secondary)] p-3 rounded-md"
              >
                {error}
              </motion.div>
            )}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[var(--pink-primary)] hover:bg-[var(--pink-secondary)] disabled:bg-[var(--pink-muted)] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {isLoading ? "Creating account..." : "Next"}
            </motion.button>
          </form>
        )}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-3xl mb-4">📧</div>
            <div className="text-lg font-semibold mb-2 text-center text-[var(--text-primary)]">
              Check your email
            </div>
            <div className="text-[var(--text-secondary)] text-center mb-4">
              We sent a confirmation link to{" "}
              <span className="font-mono text-[var(--pink-primary)]">
                {pendingEmail}
              </span>
              .<br />
              Please confirm your email to continue.
            </div>
            <div className="text-sm text-[var(--text-muted)] text-center">
              This page will automatically continue once you confirm your email.
            </div>
          </div>
        )}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Profile Picture (Optional)
              </label>
              <div className="relative">
                <div
                  onClick={handleAvatarClick}
                  className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-primary)] transition-colors overflow-hidden"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-[var(--text-muted)]">
                      {displayName ? displayName[0].toUpperCase() : "?"}
                    </span>
                  )}
                </div>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 bg-[var(--error)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[var(--error)]/80"
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                placeholder="Enter your display name"
              />
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[var(--error)] text-sm text-center bg-[var(--bg-secondary)] p-3 rounded-md"
              >
                {error}
              </motion.div>
            )}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[var(--pink-primary)] hover:bg-[var(--pink-secondary)] disabled:bg-[var(--pink-muted)] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {isLoading ? "Finishing..." : "Finish Registration"}
            </motion.button>
          </form>
        )}
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-[var(--pink-primary)] hover:text-[var(--pink-secondary)] font-medium transition-colors"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
