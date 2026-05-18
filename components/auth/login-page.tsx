"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Chrome, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot" | "update-password";

type LoginPageProps = {
  initialMode: AuthMode;
  nextPath: string;
};

export function LoginPage({ initialMode, nextPath }: LoginPageProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update-password");
        setMessage("Enter your new password below.");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function resolveRedirectPath() {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return nextPath;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin" && (nextPath === "/" || nextPath === "/account" || nextPath === "/login")) {
      return "/admin";
    }

    return nextPath;
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "signup") {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setMessage("Enter name, email, and password.");
          return;
        }

        if (password !== confirmPassword) {
          setMessage("Passwords do not match.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              registration_source: "website"
            },
            emailRedirectTo: `${getClientEnv().NEXT_PUBLIC_APP_URL}/login?mode=login&next=${encodeURIComponent(nextPath)}`
          }
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (data.session) {
          window.sessionStorage.setItem("kps-auth-flash", `Thanks for signing up, ${name.trim()}!`);
          router.replace(await resolveRedirectPath());
          router.refresh();
          return;
        }

        setMessage(`Thanks for signing up, ${name.trim()}. Check your email to confirm your account.`);
        return;
      }

      if (mode === "forgot") {
        if (!email.trim()) {
          setMessage("Enter your email address.");
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${getClientEnv().NEXT_PUBLIC_APP_URL}/login?mode=update-password&next=${encodeURIComponent(nextPath)}`
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage("Password reset link sent.");
        return;
      }

      if (mode === "update-password") {
        if (!password.trim()) {
          setMessage("Enter a new password.");
          return;
        }

        if (password !== confirmPassword) {
          setMessage("Passwords do not match.");
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setMessage(error.message);
          return;
        }

        router.replace(await resolveRedirectPath());
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("name")
        .eq("id", data.user.id)
        .single();

      window.sessionStorage.setItem(
        "kps-auth-flash",
        `Welcome back${profile?.name ? `, ${profile.name}` : ""}!`
      );
      router.replace(await resolveRedirectPath());
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getClientEnv().NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`
        }
      });

      if (error) {
        setMessage(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const title =
    mode === "signup"
      ? "Create account"
      : mode === "forgot"
        ? "Reset password"
        : mode === "update-password"
          ? "Set new password"
          : "Login";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Account Access</p>
        <h1 className="mt-3 font-display text-3xl text-white">{title}</h1>
        <p className="mt-3 text-sm text-foreground/70">Use the same page for customer and admin login.</p>
      </section>

      <section className="mt-6">
        <div className="glass-panel rounded-[28px] p-6 sm:p-8">
          <div className="mb-5">
            <Button variant="secondary" className="w-full" onClick={handleGoogleLogin} disabled={isSubmitting}>
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={mode === "login" ? "primary" : "secondary"} size="sm" onClick={() => setMode("login")}>
              Login
            </Button>
            <Button variant={mode === "signup" ? "primary" : "secondary"} size="sm" onClick={() => setMode("signup")}>
              Signup
            </Button>
            <Button variant={mode === "forgot" ? "primary" : "secondary"} size="sm" onClick={() => setMode("forgot")}>
              Forgot password
            </Button>
          </div>

          <div className="mt-6 grid gap-4">
            {mode === "signup" ? (
              <input
                className="rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            ) : null}

            {mode !== "update-password" ? (
              <input
                className="rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            ) : null}

            {mode !== "forgot" ? (
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 pr-12 text-sm outline-none"
                  placeholder={mode === "update-password" ? "New password" : "Password"}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/65"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            ) : null}

            {mode === "signup" || mode === "update-password" ? (
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 pr-12 text-sm outline-none"
                  placeholder="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/65"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            ) : null}

            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : mode === "update-password"
                      ? "Update password"
                      : "Login"}
            </Button>

            {message ? <p className="text-sm text-foreground/70">{message}</p> : null}
          </div>
        </div>
      </section>

      <div className="mt-6 rounded-[28px] border border-brand/20 bg-brand/10 p-5 text-sm text-foreground/75">
        <ShieldCheck className="mr-2 inline h-4 w-4 text-brand" />
        Customers continue to checkout. Admins can open the admin page after login.
      </div>
    </main>
  );
}
