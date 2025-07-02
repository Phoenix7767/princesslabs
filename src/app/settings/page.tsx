"use client";
import { useEffect, useState, useRef } from "react";
import { getCurrentUser, getAvatarUrl, getBaseUrl } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/auth";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Redirect to /auth if not logged in
    getCurrentUser().then((u) => {
      if (!u) window.location.href = `${getBaseUrl()}/auth`;
      else setLoading(false);
    });

    getCurrentUser().then((u) => {
      setUser(u);
      setDisplayName(u?.display_name || "");
      setAvatarPreview(u ? getAvatarUrl(u) : "");
    });
  }, []);

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
    setAvatarPreview(user ? getAvatarUrl(user) : "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    // Update display name
    if (displayName && displayName !== user.display_name) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ display_name: displayName })
        .eq("id", user.id);
      if (updateError) {
        setError("Failed to update display name");
        setIsSaving(false);
        return;
      }
    }
    // Upload avatar if changed
    if (avatar) {
      const fileExt = avatar.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatar, { upsert: true });
      if (uploadError) {
        setError("Failed to upload avatar");
        setIsSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      const avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updateError) {
        setError("Avatar uploaded, but failed to update profile");
        setIsSaving(false);
        return;
      }
    }
    // Refresh user
    const updated = await getCurrentUser();
    setUser(updated);
    setAvatar(null);
    setAvatarPreview(updated ? getAvatarUrl(updated) : "");
    setSuccess("Profile updated!");
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <div className="text-lg text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto mt-12 bg-[var(--bg-primary)] shadow-lg rounded-lg px-8 pt-8 pb-10"
    >
      <h1 className="text-3xl font-bold mb-8 text-center text-[var(--text-primary)]">
        Settings
      </h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Profile Picture
          </label>
          <div className="relative">
            <div
              onClick={handleAvatarClick}
              className="w-24 h-24 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-primary)] transition-colors overflow-hidden"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-[var(--text-muted)]">
                  {displayName ? displayName[0].toUpperCase() : "?"}
                </span>
              )}
            </div>
            {avatarPreview !== getAvatarUrl(user) && (
              <button
                type="button"
                onClick={removeAvatar}
                className="absolute -top-1 -right-1 bg-[var(--error)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[var(--error)]/80"
              >
                ×
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            Email
          </label>
          <div className="w-full px-3 py-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm cursor-not-allowed select-all">
            {user.email}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            Username
          </label>
          <div className="w-full px-3 py-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm cursor-not-allowed select-all">
            {user.username}
          </div>
        </div>
        {error && (
          <div className="text-[var(--error)] text-sm text-center mb-2 bg-[var(--bg-secondary)] p-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="text-[var(--success)] text-sm text-center mb-2 bg-[var(--bg-secondary)] p-3 rounded-md">
            {success}
          </div>
        )}
        <motion.button
          type="submit"
          disabled={isSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[var(--pink-primary)] hover:bg-[var(--pink-secondary)] disabled:bg-[var(--pink-muted)] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </motion.button>
      </form>
    </motion.div>
  );
}
