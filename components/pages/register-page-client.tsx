"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { validatePassword } from "@/lib/password";
import { registerUser } from "@/services/auth.service";
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

export function RegisterPageClient() {
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/projects");
    }
  }, [router, status]);

  const handleRegister = async () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    let hasError = false;
    if (!name.trim()) {
      setNameError("Name is required");
      hasError = true;
    }

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
    } else {
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        setPasswordError(passwordCheck.message ?? "Invalid password");
        hasError = true;
      }
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Confirm password is required");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    await toast.promise(
      (async () => {
        await registerUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!result || result.error) {
          throw new Error("Account created, but automatic sign-in failed.");
        }

        posthog.identify(email.trim().toLowerCase(), { email: email.trim().toLowerCase(), name: name.trim() });

        router.replace("/projects");
      })(),
      {
        loading: "Registering...",
        success: "Registered successfully",
        error: (err) => err?.message || "Registration failed",
      },
    );
  };

  const handleGoogleRegister = () => {
    void signIn("google", { callbackUrl: "/projects" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your email below to create an account</CardDescription>
          <CardAction>
            <Button className="cursor-pointer" variant="link" onClick={() => router.push("/login")}>
              Login
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
              {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
              <p className="text-xs text-muted-foreground">
                At least 8 characters, one uppercase, one lowercase, one digit, one special character (!@#$%^&* etc.)
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
              />
              {confirmPasswordError ? <p className="text-sm text-destructive">{confirmPasswordError}</p> : null}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button className="w-full cursor-pointer" onClick={handleRegister}>
            Register
          </Button>

          <div className="relative my-2 flex w-full items-center justify-center">
            <div className="grow border-t border-muted-foreground/30" />
            <span className="px-3 text-sm text-muted-foreground">or</span>
            <div className="grow border-t border-muted-foreground/30" />
          </div>

          <Button
            variant="outline"
            className="flex w-full cursor-pointer items-center justify-center gap-2 hover:bg-primary/90"
            onClick={handleGoogleRegister}
          >
            <span className="rounded-full p-1">
              <Image src="/google-logo.png" alt="Google" width={20} height={20} />
            </span>
            <span>Register with Google</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
