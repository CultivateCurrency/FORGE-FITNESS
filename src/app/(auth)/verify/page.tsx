"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { Loader2, CheckCircle } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const { pendingEmail } = useAuthStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!pendingEmail) {
      router.push("/signup");
    }
  }, [pendingEmail, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the full 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otp: otpString }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-zinc-400">Redirecting to login...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Verify Email</CardTitle>
        <CardDescription className="text-zinc-400">
          Enter the 6-digit code sent to{" "}
          <span className="text-orange-500">{pendingEmail}</span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>

          <p className="text-sm text-zinc-400 text-center">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              disabled={isResending}
              className="text-orange-500 hover:underline disabled:opacity-50"
              onClick={async () => {
                if (!pendingEmail) return;
                setIsResending(true);
                setResendMsg("");
                setError("");
                try {
                  const res = await fetch("/api/auth/resend-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: pendingEmail }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setResendMsg("A new code has been sent to your email.");
                  } else {
                    setError(data.error || "Failed to resend code");
                  }
                } catch {
                  setError("Failed to resend code. Please try again.");
                } finally {
                  setIsResending(false);
                }
              }}
            >
              {isResending ? "Sending..." : "Resend OTP"}
            </button>
          </p>
          {resendMsg && (
            <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              {resendMsg}
            </div>
          )}
        </CardContent>
      </form>
    </Card>
  );
}
