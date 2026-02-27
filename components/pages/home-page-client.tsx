"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function HomePageClient() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <div className="flex gap-4">
        <Button className="cursor-pointer" onClick={() => router.push("/login")}>
          Login
        </Button>
        <Button className="cursor-pointer" onClick={() => router.push("/register")}>
          Register
        </Button>
      </div>
    </div>
  );
}
