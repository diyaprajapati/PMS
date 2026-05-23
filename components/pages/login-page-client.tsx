"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPageClient() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/projects");
    }
  }, [router, status]);

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    let hasError = false;
    if (!email) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    await toast.promise(
      (async () => {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!result || result.error) {
          throw new Error("Invalid email or password");
        }

        posthog.identify(email, { email });
        posthog.capture("user_logged_in", { method: "credentials" });

        router.replace("/projects");
      })(),
      {
        loading: "Logging in...",
        success: "Login successful",
        error: (err) => err?.message || "Login failed",
      },
    );
  };

  const handleGoogleLogin = () => {
    posthog.capture("user_logged_in_google", { method: "google" });
    void signIn("google", { callbackUrl: "/projects" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
          <CardAction>
            <Button className="cursor-pointer" variant="link" onClick={() => router.push("/register")}>
              Sign Up
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button className="w-full cursor-pointer" onClick={handleLogin}>
            Login
          </Button>

          <div className="relative my-2 flex w-full items-center justify-center">
            <div className="grow border-t border-muted-foreground/30" />
            <span className="px-3 text-sm text-muted-foreground">or</span>
            <div className="grow border-t border-muted-foreground/30" />
          </div>

          <Button
            variant="outline"
            className="flex w-full cursor-pointer items-center justify-center gap-2"
            onClick={handleGoogleLogin}
          >
            <span className="rounded-full p-1">
              <Image src="/google-logo.png" alt="Google" width={20} height={20} />
            </span>
            <span>Login with Google</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
