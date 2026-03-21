"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Lock,
  Camera,
  Dumbbell,
  Music,
  CreditCard,
  HelpCircle,
  Shield,
  FileText,
  LogOut,
  ChevronRight,
  Crown,
  Loader2,
  Check,
  Zap,
  Star,
  CheckCircle2,
  X,
  Ban,
  Trash2,
} from "lucide-react";
import { useApi, apiFetch } from "@/hooks/use-api";
import { useUpload } from "@/hooks/use-upload";
import { signOut } from "next-auth/react";

interface SubscriptionData {
  id: string;
  plan: "BASIC" | "PREMIUM" | "ELITE";
  interval: "MONTHLY" | "YEARLY";
  status: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING";
  currentPeriodEnd: string | null;
}

const PLANS = [
  {
    key: "BASIC",
    name: "Basic",
    monthlyPrice: "$9.99",
    yearlyPrice: "$99.90",
    icon: Zap,
    color: "blue",
    features: [
      "Access to workout library",
      "Community access",
      "Event booking",
      "Basic analytics",
    ],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    monthlyPrice: "$19.99",
    yearlyPrice: "$199.90",
    icon: Star,
    color: "orange",
    popular: true,
    features: [
      "Everything in Basic",
      "Live streaming access",
      "1:1 coach messaging",
      "Music library",
      "Advanced analytics",
    ],
  },
  {
    key: "ELITE",
    name: "Elite",
    monthlyPrice: "$39.99",
    yearlyPrice: "$399.90",
    icon: Crown,
    color: "purple",
    features: [
      "Everything in Premium",
      "Priority event booking",
      "Personal training sessions",
      "Exclusive content",
      "Wearable integration",
    ],
  },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 text-orange-500 animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profilePhoto: string | null;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { upload, uploading } = useUpload();
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; fullName: string; username: string }[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const { data: userData } = useApi<UserProfile>("/api/users/me");
  const { data: subData } = useApi<SubscriptionData>("/api/admin/subscriptions?mySubscription=true");

  // Populate form with current user data
  useEffect(() => {
    if (userData) {
      setFullName(userData.fullName || "");
      setUsername(userData.username || "");
      setEmail(userData.email || "");
      setProfilePhoto(userData.profilePhoto || null);
    }
  }, [userData]);

  // Load blocked users
  useEffect(() => {
    fetch("/api/users/me/blocked")
      .then((r) => r.json())
      .then((d) => { if (d.success) setBlockedUsers(d.data || []); })
      .catch(() => {});
  }, []);

  const handleUnblock = async (blockedId: string) => {
    setUnblocking(blockedId);
    try {
      await apiFetch(`/api/users/${blockedId}/block`, { method: "DELETE" });
      setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedId));
    } catch { /* ignore */ } finally {
      setUnblocking(null);
    }
  };

  // Check for success redirect from Stripe
  useEffect(() => {
    if (searchParams.get("status") === "success") {
      setSubSuccess(true);
    }
  }, [searchParams]);

  const currentPlan = subData?.plan || null;
  const subStatus = subData?.status;

  const handleSubscribe = async (plan: string) => {
    setSubscribing(plan);
    try {
      const res = await apiFetch<{ url: string }>("/api/payments/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan, interval: billingInterval }),
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.message || "Failed to start checkout");
    } finally {
      setSubscribing(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const res = await apiFetch<{ url: string }>("/api/payments/portal", {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.message || "Failed to open billing portal");
    } finally {
      setManagingPortal(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account and preferences.</p>
      </div>

      {/* Success Banner */}
      {subSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-green-400 font-medium">Subscription activated!</p>
            <p className="text-green-400/70 text-sm">Welcome to Gymtality Premium.</p>
          </div>
          <button onClick={() => setSubSuccess(false)} className="text-green-400/50 hover:text-green-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* My Profile */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            My Profile
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-orange-500/20 text-orange-500 text-2xl font-bold">
                    J
                  </AvatarFallback>
                )}
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1.5 bg-orange-500 rounded-full hover:bg-orange-600 transition cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-3 w-3 text-white animate-spin" />
                ) : (
                  <Camera className="h-3 w-3 text-white" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const result = await upload(file, "profile-photos", "image");
                        setProfilePhoto(result.url);
                      } catch { /* handled by hook */ }
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <p className="text-sm text-zinc-300">Profile Picture</p>
              <p className="text-xs text-zinc-500">JPG, PNG, or GIF. Max 5MB.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              prefix="@"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300 flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-500" />
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300 flex items-center gap-2">
              <Lock className="h-4 w-4 text-zinc-500" />
              Password
            </label>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Change Password
            </Button>
          </div>

          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setSaveSuccess(false);
              try {
                await apiFetch(`/api/users/${userData?.id}`, {
                  method: "PUT",
                  body: JSON.stringify({ fullName, username, email, profilePhoto }),
                });
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
              } catch (e: any) {
                alert(e.message || "Failed to save");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : saveSuccess ? <Check className="h-4 w-4 mr-2" /> : null}
            {saveSuccess ? "Saved!" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-4 divide-y divide-zinc-800">
          <Link href="/member/workouts" className="flex items-center justify-between py-3 group">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-blue-400" />
              <span className="text-zinc-300 group-hover:text-white transition">My Workout Plans</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>
          <Link href="/member/music" className="flex items-center justify-between py-3 group">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-purple-400" />
              <span className="text-zinc-300 group-hover:text-white transition">My Playlist</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-500" />
            My Subscription Plan
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Choose the plan that fits your fitness journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Current Plan Banner */}
          {currentPlan && subStatus === "ACTIVE" && (
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-amber-400" />
                <div>
                  <p className="font-semibold text-white">{currentPlan} Plan</p>
                  <p className="text-xs text-zinc-400">
                    {subData?.currentPeriodEnd
                      ? `Renews ${new Date(subData.currentPeriodEnd).toLocaleDateString()}`
                      : "Active subscription"}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${billingInterval === "MONTHLY" ? "text-white" : "text-zinc-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval((prev) => (prev === "MONTHLY" ? "YEARLY" : "MONTHLY"))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                billingInterval === "YEARLY" ? "bg-orange-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  billingInterval === "YEARLY" ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={`text-sm ${billingInterval === "YEARLY" ? "text-white" : "text-zinc-500"}`}>
              Yearly
            </span>
            {billingInterval === "YEARLY" && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Save 17%
              </Badge>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 gap-3">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.key && subStatus === "ACTIVE";
              const price = billingInterval === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
              const interval = billingInterval === "YEARLY" ? "/year" : "/month";

              return (
                <div
                  key={plan.key}
                  className={`relative p-4 rounded-lg border transition ${
                    isCurrent
                      ? "border-orange-500 bg-orange-500/5"
                      : plan.popular
                        ? "border-orange-500/50 bg-zinc-800"
                        : "border-zinc-700 bg-zinc-800"
                  }`}
                >
                  {plan.popular && !isCurrent && (
                    <Badge className="absolute -top-2 right-3 bg-orange-500 text-white border-0 text-xs">
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${plan.color}-500/20`}>
                        <plan.icon className={`h-5 w-5 text-${plan.color}-500`} />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{plan.name}</p>
                        <p className="text-sm text-orange-500 font-bold">
                          {price}<span className="text-zinc-500 font-normal text-xs">{interval}</span>
                        </p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        Current
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={subscribing !== null}
                        onClick={() => handleSubscribe(plan.key)}
                      >
                        {subscribing === plan.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Select"
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plan.features.map((f) => (
                      <span key={f} className="text-xs text-zinc-400 flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manage Subscription */}
          {currentPlan && subStatus === "ACTIVE" && (
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              disabled={managingPortal}
              onClick={handleManageSubscription}
            >
              {managingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Manage Billing
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Support & Legal */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-4 divide-y divide-zinc-800">
          <Link href="/member/help" className="flex items-center justify-between py-3 w-full group">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-green-400" />
              <span className="text-zinc-300 group-hover:text-white transition">Help & Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>
          <Link href="/privacy" className="flex items-center justify-between py-3 w-full group">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-cyan-400" />
              <span className="text-zinc-300 group-hover:text-white transition">Privacy Policy</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>
          <Link href="/terms" className="flex items-center justify-between py-3 w-full group">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-zinc-400" />
              <span className="text-zinc-300 group-hover:text-white transition">Terms & Conditions</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>
        </CardContent>
      </Card>

      {/* Blocked Accounts */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-400" />
            Blocked Accounts
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Users you have blocked will not be able to message you or see your activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No blocked accounts</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{user.fullName}</p>
                    <p className="text-xs text-zinc-400">@{user.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    disabled={unblocking === user.id}
                    onClick={() => handleUnblock(user.id)}
                  >
                    {unblocking === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Unblock"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
