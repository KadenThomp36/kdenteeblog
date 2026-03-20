"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin/posts");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/">
            <span className="font-display text-4xl tracking-tight text-foreground hover:text-primary transition-colors">
              KdenTee
            </span>
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="font-display text-2xl tracking-tight mb-2">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 rounded-sm border-border bg-transparent placeholder:text-muted-foreground/40 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                required
                className="h-11 rounded-sm border-border bg-transparent placeholder:text-muted-foreground/40 focus-visible:ring-primary"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-sm bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-colors font-medium text-sm"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover-line"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
