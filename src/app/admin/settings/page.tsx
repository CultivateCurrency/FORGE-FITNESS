"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Building2,
  Upload,
  Palette,
  Users,
  Shield,
  CreditCard,
  Bell,
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Crown,
  Loader2,
  Save,
} from "lucide-react";
import { useApi, apiFetch } from "@/hooks/use-api";

interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  favicon: string | null;
  customDomain: string | null;
  features: string[];
  settings: Record<string, unknown>;
  plan: string;
  status: string;
}

const roles = [
  { name: "Admin", description: "Full platform access", users: 2, color: "text-purple-400", bg: "bg-purple-500/20" },
  { name: "Coach", description: "Content creation, client management, streaming", users: 4, color: "text-blue-400", bg: "bg-blue-500/20" },
  { name: "Member", description: "Access content, community, shop", users: 2487, color: "text-green-400", bg: "bg-green-500/20" },
  { name: "Moderator", description: "Community moderation, report review", users: 3, color: "text-amber-400", bg: "bg-amber-500/20" },
];

const announcements = [
  { id: 1, title: "Scheduled Maintenance - March 20", message: "Platform will be down for maintenance from 2-4 AM EST.", status: "Scheduled", date: "2026-03-20" },
  { id: 2, title: "New Feature: Live Streaming", message: "Coaches can now go live and interact with their audience in real-time!", status: "Active", date: "2026-03-10" },
  { id: 3, title: "Spring Challenge Launch", message: "Join our 30-day spring fitness challenge starting April 1st.", status: "Draft", date: "2026-04-01" },
];

export default function AdminSettingsPage() {
  const { data: tenant, loading, error, refetch } = useApi<TenantSettings>("/api/admin/settings");
  const [gymName, setGymName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f97316");
  const [accentColor, setAccentColor] = useState("#1A1A2E");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Populate form when tenant data loads
  useEffect(() => {
    if (tenant) {
      setGymName(tenant.name);
      setPrimaryColor(tenant.primaryColor);
      setAccentColor(tenant.accentColor);
    }
  }, [tenant]);

  async function handleSaveSettings() {
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          name: gymName,
          primaryColor,
          accentColor,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refetch();
    } catch (e: any) {
      setSaveError(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-zinc-400 mt-1">
          Configure your platform, roles, payments, and notifications.
        </p>
      </div>

      {/* Tenant / Gym Settings */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-500" />
            Gym / Tenant Settings
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Configure your platform branding and identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-3 text-zinc-400 py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading settings...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-3">{error}</p>
              <Button
                variant="outline"
                onClick={refetch}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                  {tenant?.logo ? (
                    <img src={tenant.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-orange-500">
                      {gymName?.charAt(0)?.toUpperCase() || "G"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-zinc-300">Platform Logo</p>
                  <p className="text-xs text-zinc-500">PNG or SVG, 256x256px recommended.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              {/* Platform Name */}
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Platform Name</label>
                <Input
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Brand Colors */}
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-zinc-500" />
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-zinc-700"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white max-w-[200px]"
                  />
                  <div className="flex gap-2">
                    {["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setPrimaryColor(color)}
                        className={`w-8 h-8 rounded-lg border-2 transition ${
                          primaryColor === color ? "border-white" : "border-zinc-700"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-zinc-500" />
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-zinc-700"
                    style={{ backgroundColor: accentColor }}
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white max-w-[200px]"
                  />
                </div>
              </div>

              {/* Tenant info (read-only) */}
              {tenant && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-800/50 rounded-lg">
                  <div>
                    <p className="text-xs text-zinc-500">Slug</p>
                    <p className="text-sm text-zinc-300 font-mono">{tenant.slug}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Plan</p>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {tenant.plan}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Status</p>
                    <Badge className={
                      tenant.status === "ACTIVE" ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }>
                      {tenant.status}
                    </Badge>
                  </div>
                  {tenant.customDomain && (
                    <div>
                      <p className="text-xs text-zinc-500">Custom Domain</p>
                      <p className="text-sm text-zinc-300">{tenant.customDomain}</p>
                    </div>
                  )}
                </div>
              )}

              {saveError && (
                <p className="text-red-400 text-sm">{saveError}</p>
              )}

              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Role Management */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Role Management
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Manage user roles and permissions.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.name}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role.bg}`}>
                    {role.name === "Admin" ? (
                      <Crown className={`h-4 w-4 ${role.color}`} />
                    ) : (
                      <Users className={`h-4 w-4 ${role.color}`} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{role.name}</p>
                    <p className="text-xs text-zinc-500">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600">
                    {role.users.toLocaleString()} users
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stripe Settings */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-500" />
            Payment Settings (Stripe)
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Configure Stripe integration for subscriptions, payments, and payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-zinc-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <CreditCard className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Stripe Account</p>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Stripe Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">Publishable Key</label>
              <Input
                value="pk_live_••••••••••••••••"
                readOnly
                className="bg-zinc-800 border-zinc-700 text-zinc-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">Secret Key</label>
              <Input
                value="sk_live_••••••••••••••••"
                readOnly
                className="bg-zinc-800 border-zinc-700 text-zinc-500"
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Coach Commission Rate</p>
                <p className="text-xs text-zinc-400">Platform fee deducted from coach earnings</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  defaultValue={15}
                  className="bg-zinc-700 border-zinc-600 text-white w-20 text-center"
                />
                <span className="text-zinc-400">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Notification Settings
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Configure platform-wide notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "New user registration", description: "Notify admins when new users sign up", enabled: true },
            { label: "Coach application submitted", description: "Notify when a new coach applies", enabled: true },
            { label: "Content reported", description: "Notify moderators of new reports", enabled: true },
            { label: "Order placed", description: "Notify on new shop orders", enabled: false },
            { label: "Subscription changes", description: "Notify on upgrades, downgrades, cancellations", enabled: true },
          ].map((setting) => (
            <div
              key={setting.label}
              className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
            >
              <div>
                <p className="text-sm text-zinc-300">{setting.label}</p>
                <p className="text-xs text-zinc-500">{setting.description}</p>
              </div>
              <button
                className={`w-12 h-6 rounded-full transition relative ${
                  setting.enabled ? "bg-orange-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${
                    setting.enabled ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Announcements */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-orange-500" />
                System Announcements
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Create platform-wide announcements for all users.
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAnnouncement(!showAnnouncement)}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </CardHeader>
        {showAnnouncement && (
          <CardContent className="border-t border-zinc-800 pt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">Title</label>
              <Input
                placeholder="Announcement title..."
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">Message</label>
              <Textarea
                placeholder="Write your announcement..."
                className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
              />
            </div>
            <div className="flex gap-3">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Publish
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Save as Draft
              </Button>
            </div>
          </CardContent>
        )}
        <CardContent className={showAnnouncement ? "pt-4" : ""}>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="flex items-start justify-between p-3 bg-zinc-800 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{ann.title}</p>
                    <Badge
                      className={
                        ann.status === "Active"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : ann.status === "Scheduled"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-zinc-700 text-zinc-400 border-zinc-600"
                      }
                    >
                      {ann.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{ann.message}</p>
                  <p className="text-xs text-zinc-500 mt-1">{ann.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
