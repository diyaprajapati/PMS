'use client';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import Image from "next/image"

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Redirect away from login if already authenticated
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as {
        exp?: number;
      };
      if (payload?.exp && payload.exp * 1000 > Date.now()) {
        // router.replace("/dashboard");
        router.replace("/projects");
      } else {
        localStorage.removeItem("token");
      }
    } catch {
      localStorage.removeItem("token");
    }
  }, [router]);

  const handleLogin = async () => {
    // reset errors
    setEmailError("");
    setPasswordError("");

    // simple client-side validation like zod messages
    let hasError = false;
    if (!email) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
      toast.error("Please enter a valid email");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) return;

    await toast.promise(
      (async () => {
        // Check if localStorage is available
        if (typeof window === "undefined") {
          throw new Error("Window is not available");
        }
        
        if (typeof localStorage === "undefined") {
          throw new Error("localStorage is not available in this browser");
        }

        // Test localStorage write/read capability
        try {
          const testKey = "__localStorage_test__";
          localStorage.setItem(testKey, "test");
          const testValue = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          if (testValue !== "test") {
            throw new Error("localStorage write/read test failed");
          }
          console.log("✅ localStorage is working correctly");
        } catch (testError: any) {
          console.error("localStorage test failed:", testError);
          throw new Error(`localStorage is not working: ${testError?.message || "Unknown error"}`);
        }

        const res = await fetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Ensure cookies are sent/received
        });

        const data = await res.json();
        console.log("Login response:", { ok: res.ok, status: res.status, hasToken: !!data?.token, data });

        if (!res.ok) {
          throw new Error(data.error || data.message || "Login failed");
        }

        // persist token for client-side checks
        if (data?.token) {
          try {
            // Validate it's a real JWT token (has 3 parts and proper structure)
            const tokenParts = data.token.split(".");
            if (tokenParts.length !== 3) {
              console.error("Invalid token format - expected JWT with 3 parts:", data.token.substring(0, 50));
              throw new Error("Invalid token format received from server");
            }
            
            // Decode and verify token payload
            try {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log("Token payload:", { 
                hasId: !!payload.id, 
                hasEmail: !!payload.email, 
                hasExp: !!payload.exp,
                userId: payload.id?.substring(0, 8) + "..."
              });
              
              if (!payload.id || !payload.email) {
                console.warn("Token missing required fields (id or email)");
              }
            } catch (decodeError) {
              console.error("Failed to decode token payload:", decodeError);
              throw new Error("Invalid token payload");
            }
            
            // Store the token
            console.log("Attempting to store token in localStorage...");
            localStorage.setItem("token", data.token);
            console.log("✅ localStorage.setItem() called successfully");
            
            // Wait a tiny bit to ensure write completes
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Verify it was stored immediately
            const storedToken = localStorage.getItem("token");
            console.log("Token verification after storage:", { 
              stored: !!storedToken, 
              matches: storedToken === data.token,
              storedLength: storedToken?.length,
              receivedLength: data.token.length,
              firstChars: storedToken?.substring(0, 30) + "...",
              fullToken: storedToken // Log full token for debugging
            });
            
            if (!storedToken) {
              console.error("❌ Token is NULL after storage!");
              throw new Error("Token was not stored - localStorage returned null");
            }
            
            if (storedToken !== data.token) {
              console.error("❌ Token mismatch after storage!", {
                stored: storedToken?.substring(0, 50),
                expected: data.token.substring(0, 50),
                storedLength: storedToken?.length,
                expectedLength: data.token.length
              });
              throw new Error("Token was not stored correctly - values don't match");
            }
            
            console.log("✅ Token verified successfully in localStorage");
          } catch (storageError: any) {
            console.error("Failed to store token in localStorage:", storageError);
            throw new Error(`Failed to store authentication token: ${storageError?.message || "Unknown error"}`);
          }
        } else {
          console.error("No token received in login response:", data);
          throw new Error("No authentication token received from server");
        }

        // Double-check token is stored before returning (with multiple checks)
        let finalCheck = localStorage.getItem("token");
        console.log("Final check #1:", { 
          hasToken: !!finalCheck, 
          matches: finalCheck === data.token,
          length: finalCheck?.length 
        });
        
        // Wait a bit more and check again
        await new Promise(resolve => setTimeout(resolve, 50));
        finalCheck = localStorage.getItem("token");
        console.log("Final check #2 (after 50ms):", { 
          hasToken: !!finalCheck, 
          matches: finalCheck === data.token,
          length: finalCheck?.length 
        });
        
        if (!finalCheck) {
          console.error("❌ Token is NULL in final check!");
          throw new Error("Token was not persisted - localStorage returned null");
        }
        
        if (finalCheck !== data.token) {
          console.error("❌ Token mismatch in final check!", {
            stored: finalCheck.substring(0, 50),
            expected: data.token.substring(0, 50)
          });
          throw new Error("Token was not persisted correctly - values don't match");
        }
        
        console.log("✅✅✅ Login complete - token verified TWICE in localStorage");
        console.log("Token value:", finalCheck.substring(0, 50) + "...");
        return data;
      })(),
      {
        loading: "Logging in...",
        success: () => {
          // Token is already stored and verified in the async function above
          // Use replace instead of push to prevent back navigation to login
          router.replace("/projects");
          return "Login successful";
        },
        error: (err: any) => {
          console.error("Login error:", err);
          return err?.message || "Login failed";
        },
      }
    );
  };

  const handleGoogleLogin = () => {
    // After Google OAuth, go to dashboard with a flag so we can show a toast
    signIn("google", { callbackUrl: "/projects" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
          <CardAction>
            <Button className="cursor-pointer" variant="link" onClick={() => router.push('/register')}>
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
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button className="w-full cursor-pointer" onClick={handleLogin}>
            Login
          </Button>

            <div className="relative flex items-center justify-center w-full my-2">
                <div className="grow border-t border-muted-foreground/30"></div>
                <span className="px-3 text-sm text-muted-foreground">or</span>
                <div className="grow border-t border-muted-foreground/30"></div>
            </div>

            <Button
                variant="outline"
                className="w-full cursor-pointer flex items-center justify-center gap-2"
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
  )
}