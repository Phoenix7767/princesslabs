import { supabase } from "./supabase";

// Utility function to get the base URL for redirects
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use the current origin (works for both www and non-www)
    return window.location.origin;
  }

  // Server-side fallback
  return "https://princess-labs.com";
}

export interface User {
  id: string;
  display_name: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface RegisterData {
  display_name: string;
  username: string;
  email: string;
  password: string;
  avatar?: File;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function register(
  data: RegisterData
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("username")
      .eq("username", data.username)
      .single();

    if (existingUser) {
      return { user: null, error: "Username already exists" };
    }

    // Create user with Supabase Auth and pass extra fields
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.display_name,
          username: data.username,
        },
      },
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: "Failed to create user" };
    }

    // Wait for the user profile to be created by the trigger
    let profile: User | null = null;
    let attempts = 0;
    while (!profile && attempts < 10) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();
      if (userProfile) profile = userProfile;
      else await new Promise((res) => setTimeout(res, 200));
      attempts++;
    }
    if (!profile) {
      return {
        user: null,
        error: "Profile creation failed. Please try again.",
      };
    }

    // If avatar is provided, upload it and update the profile
    if (data.avatar) {
      const fileExt = data.avatar.name.split(".").pop();
      const fileName = `${authData.user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, data.avatar, { upsert: true });

      if (uploadError) {
        // User is registered, but avatar upload failed
        return {
          user: profile,
          error:
            "Registered, but failed to upload avatar. You can update your avatar later.",
        };
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      const avatarUrl = urlData.publicUrl;

      // Update user profile with avatar_url
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", authData.user.id);

      if (updateError) {
        // User is registered, avatar uploaded, but profile update failed
        return {
          user: { ...profile, avatar_url: avatarUrl },
          error:
            "Registered and avatar uploaded, but failed to update profile with avatar. You can update your avatar later.",
        };
      }

      // Return user with avatar_url
      return { user: { ...profile, avatar_url: avatarUrl }, error: null };
    }

    // No avatar provided, registration complete
    return { user: profile, error: null };
  } catch {
    return { user: null, error: "Registration failed" };
  }
}

export async function login(
  data: LoginData
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Sign in with Supabase Auth using email
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      return { user: null, error: "Invalid credentials" };
    }

    if (!authData.user) {
      return { user: null, error: "Login failed" };
    }

    // Get user profile
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (error || !user) {
      return { user: null, error: "Failed to get user profile" };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: "Login failed" };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return data || null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  } catch {
    return { error: "Logout failed" };
  }
}

export function getAvatarUrl(user: User): string {
  if (user.avatar_url) {
    return user.avatar_url;
  }

  // Return first letter of display name as fallback
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.display_name
  )}&background=random&size=128`;
}
