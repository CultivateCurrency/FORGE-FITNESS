"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/use-api";
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
import {
  HelpCircle,
  Mail,
  Phone,
  Send,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const faqs = [
  {
    question: "How do I get approved as a coach?",
    answer:
      "After signing up as a coach, your profile is reviewed by the admin team. Make sure to upload your certifications and fill out your bio completely. Approval typically takes 1-3 business days.",
  },
  {
    question: "How do I upload workout plans?",
    answer:
      'Navigate to Content Upload from your dashboard sidebar. You can create workout plans with exercises, sets, reps, and even upload demo videos for each exercise.',
  },
  {
    question: "How are my earnings calculated?",
    answer:
      "You earn a commission on all paid events, live streams, and donations from members. Your commission rate is set during onboarding (default 80%). You can view your earnings breakdown on the Earnings page.",
  },
  {
    question: "How do I go live?",
    answer:
      'Go to the Live Streaming page and click "Go Live" to start an instant stream, or schedule one in advance. You\'ll need a stable internet connection for the best experience.',
  },
  {
    question: "Can I block a member from my content?",
    answer:
      "Yes, you can block members from your Settings page under Blocked Accounts, or use the Reports page to report and block suspicious users.",
  },
  {
    question: "How do I manage my clients?",
    answer:
      "The Clients CRM page shows all members who have booked your events or followed your plans. You can add notes, track their progress, and communicate directly via messages.",
  },
  {
    question: "When do I receive payouts?",
    answer:
      "Payouts are processed through Stripe on a monthly basis. Make sure your bank account details are configured in Settings. You can track all transactions on the Earnings page.",
  },
];

export default function CoachHelpPage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await apiFetch("/api/help", {
        method: "POST",
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSent(true);
      setSubject("");
      setMessage("");
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error("Failed to send support request:", err);
    } finally {
      setSending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Help & Support</h1>
        <p className="text-zinc-400 mt-1">
          Get help with your coach account, content, or earnings.
        </p>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Mail className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Email Support</p>
                <p className="text-white font-medium">support@gymtality.fit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Phone className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Phone Support</p>
                <p className="text-white font-medium">1-800-GYMTALITY</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            Contact Support
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Send us a message and we will get back to you within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question in detail..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
            />
          </div>

          {sent && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Message sent successfully! We will respond within 24 hours.
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={sending || !subject.trim() || !message.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-orange-500" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-zinc-800 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-zinc-800/50 transition"
              >
                <span className="text-sm font-medium text-zinc-200">
                  {faq.question}
                </span>
                {openFaq === index ? (
                  <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4 text-sm text-zinc-400 border-t border-zinc-800 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
