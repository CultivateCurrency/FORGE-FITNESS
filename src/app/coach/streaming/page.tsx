"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useApi, useMutation } from "@/hooks/use-api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  Video,
  Calendar,
  Clock,
  Users,
  Eye,
  Play,
  DollarSign,
  TrendingUp,
  BarChart3,
  Zap,
  Loader2,
  Copy,
  Check,
  Square,
  Key,
  Link2,
  X,
} from "lucide-react";

interface Stream {
  id: string;
  hostId: string;
  title: string;
  category: string | null;
  type: "PUBLIC" | "MEMBERS_ONLY" | "PAY_PER_VIEW" | "GROUP_ONLY";
  status: "SCHEDULED" | "LIVE" | "ENDED";
  replayUrl: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  price: number;
  viewerCount: number;
  channelArn: string | null;
  streamKey: string | null;
  ingestEndpoint: string | null;
  playbackUrl: string | null;
  createdAt: string;
}

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return "Scheduled";
  const diff = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CoachStreamingPage() {
  const { data: session } = useSession();
  const { data: streams, loading, error, refetch } = useApi<Stream[]>(
    session?.user?.id ? "/api/streaming" : null
  );

  const { mutate: createStream, loading: creating } = useMutation<Stream, Record<string, unknown>>(
    "/api/streaming",
    "POST"
  );

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamCategory, setStreamCategory] = useState("Workout");
  const [streamDate, setStreamDate] = useState("");
  const [streamTime, setStreamTime] = useState("");
  const [streamCapacity, setStreamCapacity] = useState("");
  const [streamPrice, setStreamPrice] = useState("");
  const [isFree, setIsFree] = useState(true);

  // Live stream control state
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [showStreamPanel, setShowStreamPanel] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [goingLive, setGoingLive] = useState(false);
  const [endingStream, setEndingStream] = useState(false);

  const pastStreams = useMemo(
    () => (streams ?? []).filter((s) => s.status === "ENDED"),
    [streams]
  );
  const scheduledStreams = useMemo(
    () => (streams ?? []).filter((s) => s.status === "SCHEDULED"),
    [streams]
  );
  const liveStreams = useMemo(
    () => (streams ?? []).filter((s) => s.status === "LIVE"),
    [streams]
  );

  const totalStreams = (streams ?? []).length;
  const totalViewers = (streams ?? []).reduce((sum, s) => sum + s.viewerCount, 0);
  const peakViewers = (streams ?? []).reduce((max, s) => Math.max(max, s.viewerCount), 0);

  // Build chart data from past streams
  const viewerData = useMemo(() => {
    return pastStreams.slice(0, 8).reverse().map((s, i) => ({
      stream: s.title.length > 15 ? s.title.slice(0, 15) + "..." : s.title,
      viewers: s.viewerCount,
    }));
  }, [pastStreams]);

  async function handleSchedule() {
    if (!session?.user || !streamTitle || !streamDate || !streamTime) return;
    const userId = (session.user as any).id;
    const scheduledAt = new Date(`${streamDate}T${streamTime}`).toISOString();
    const result = await createStream({
      hostId: userId,
      title: streamTitle,
      category: streamCategory,
      scheduledAt,
      price: isFree ? 0 : Number(streamPrice) || 0,
    });
    if (result) {
      setShowScheduleForm(false);
      setStreamTitle("");
      setStreamCategory("Workout");
      setStreamDate("");
      setStreamTime("");
      setStreamCapacity("");
      setStreamPrice("");
      setIsFree(true);
      refetch();
    }
  }

  async function handleGoLive() {
    if (!session?.user) return;
    const result = await createStream({
      hostId: (session.user as any).id,
      title: "Live Stream",
      category: null,
      price: 0,
    });
    if (result) {
      // Fetch the full stream details (with stream key)
      const res = await fetch(`/api/streaming/${result.id}`);
      const data = await res.json();
      if (data.success) {
        setActiveStream(data.data);
        setShowStreamPanel(true);
      }
      refetch();
    }
  }

  async function handleStartScheduledStream(stream: Stream) {
    // Fetch stream details with stream key (only available to host)
    const res = await fetch(`/api/streaming/${stream.id}`);
    const data = await res.json();
    if (data.success) {
      setActiveStream(data.data);
      setShowStreamPanel(true);
    }
  }

  async function handleSetLive() {
    if (!activeStream) return;
    setGoingLive(true);
    try {
      const res = await fetch(`/api/streaming/${activeStream.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "LIVE" }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveStream({ ...activeStream, status: "LIVE", startedAt: new Date().toISOString() });
        refetch();
      }
    } finally {
      setGoingLive(false);
    }
  }

  async function handleEndStream() {
    if (!activeStream) return;
    setEndingStream(true);
    try {
      const res = await fetch(`/api/streaming/${activeStream.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });
      const data = await res.json();
      if (data.success) {
        setShowStreamPanel(false);
        setActiveStream(null);
        refetch();
      }
    } finally {
      setEndingStream(false);
    }
  }

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Streaming</h1>
          <p className="text-zinc-400 mt-1">
            Go live, schedule classes, and review past streams.
          </p>
        </div>
        <Button
          onClick={handleGoLive}
          disabled={creating}
          className="bg-red-500 hover:bg-red-600 text-white gap-2 px-6 py-5 text-lg font-semibold"
        >
          {creating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Radio className="h-5 w-5 animate-pulse" />
          )}
          Go Live
        </Button>
      </div>

      {/* Stream Control Panel (shown after Go Live or Start Stream) */}
      {showStreamPanel && activeStream && (
        <Card className="bg-zinc-900 border-2 border-red-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                {activeStream.status === "LIVE" ? (
                  <>
                    <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                    <span className="text-red-400">LIVE</span> — {activeStream.title}
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5 text-orange-500" />
                    Stream Ready — {activeStream.title}
                  </>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowStreamPanel(false); setActiveStream(null); }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-zinc-400">
              {activeStream.status === "LIVE"
                ? "You are broadcasting live. Use the controls below to manage your stream."
                : "Use these credentials in OBS Studio or your preferred streaming software to start broadcasting."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ingest Credentials */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Server URL (Ingest Endpoint)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={activeStream.ingestEndpoint ? `rtmps://${activeStream.ingestEndpoint}:443/app/` : "Generating..."}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 shrink-0"
                    onClick={() => copyToClipboard(`rtmps://${activeStream.ingestEndpoint}:443/app/`, "server")}
                  >
                    {copiedField === "server" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                  <Key className="h-3 w-3" /> Stream Key
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    type="password"
                    value={activeStream.streamKey || "Generating..."}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 shrink-0"
                    onClick={() => activeStream.streamKey && copyToClipboard(activeStream.streamKey, "key")}
                  >
                    {copiedField === "key" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Keep your stream key private. Never share it publicly.
                </p>
              </div>
            </div>

            {/* OBS Setup Instructions */}
            {activeStream.status !== "LIVE" && (
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 text-sm text-zinc-300 space-y-2">
                <p className="font-medium text-white">Quick Setup (OBS Studio):</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  <li>Open OBS Studio &rarr; Settings &rarr; Stream</li>
                  <li>Service: <span className="text-zinc-200">Custom</span></li>
                  <li>Paste the <span className="text-zinc-200">Server URL</span> and <span className="text-zinc-200">Stream Key</span> above</li>
                  <li>Click &quot;Start Streaming&quot; in OBS</li>
                  <li>Then click <span className="text-orange-400">&quot;Set Status to Live&quot;</span> below to notify your followers</li>
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {activeStream.status === "SCHEDULED" && (
                <Button
                  onClick={handleSetLive}
                  disabled={goingLive}
                  className="bg-red-500 hover:bg-red-600 text-white gap-2"
                >
                  {goingLive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Radio className="h-4 w-4" />
                  )}
                  Set Status to Live
                </Button>
              )}
              {activeStream.status === "LIVE" && (
                <>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Eye className="h-4 w-4" />
                    <span>{activeStream.viewerCount} viewers</span>
                  </div>
                  <div className="flex-1" />
                  <Button
                    onClick={handleEndStream}
                    disabled={endingStream}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-2"
                  >
                    {endingStream ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    End Stream
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currently Live Streams */}
      {liveStreams.length > 0 && !showStreamPanel && (
        <Card className="bg-zinc-900 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500 animate-pulse" />
              Currently Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border border-red-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-500/10">
                      <Radio className="h-6 w-6 text-red-500 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{stream.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1 text-red-400">
                          <Eye className="h-3 w-3" /> {stream.viewerCount} watching
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Started {formatDateTime(stream.startedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleStartScheduledStream(stream)}
                  >
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading streams...
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          Failed to load streams: {error}
        </div>
      )}

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Radio className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalStreams}</p>
                <p className="text-sm text-zinc-400">Total Streams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Eye className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalViewers}</p>
                <p className="text-sm text-zinc-400">Total Viewers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{peakViewers}</p>
                <p className="text-sm text-zinc-400">Peak Viewers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Zap className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{liveStreams.length}</p>
                <p className="text-sm text-zinc-400">Currently Live</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule a Live Class */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Schedule a Live Class
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {showScheduleForm ? "Cancel" : "New Schedule"}
            </Button>
          </div>
        </CardHeader>
        {showScheduleForm && (
          <CardContent className="space-y-4 border-t border-zinc-800 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Title</label>
                <Input
                  placeholder="e.g., Evening HIIT Session"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Category</label>
                <select
                  value={streamCategory}
                  onChange={(e) => setStreamCategory(e.target.value)}
                  className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
                >
                  <option>Workout</option>
                  <option>HIIT</option>
                  <option>Yoga</option>
                  <option>Meditation</option>
                  <option>Strength Training</option>
                  <option>Cardio</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Date</label>
                <Input
                  type="date"
                  value={streamDate}
                  onChange={(e) => setStreamDate(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Time</label>
                <Input
                  type="time"
                  value={streamTime}
                  onChange={(e) => setStreamTime(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Capacity</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={streamCapacity}
                  onChange={(e) => setStreamCapacity(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">Pricing</label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsFree(true)}
                  className={
                    isFree
                      ? "border-green-500/30 text-green-400 hover:bg-green-500/10 bg-green-500/10"
                      : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }
                >
                  Free
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsFree(false)}
                  className={
                    !isFree
                      ? "border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-orange-500/10"
                      : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Paid
                </Button>
                {!isFree && (
                  <Input
                    type="number"
                    placeholder="Price"
                    value={streamPrice}
                    onChange={(e) => setStreamPrice(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white max-w-[180px]"
                  />
                )}
              </div>
            </div>
            <Button
              onClick={handleSchedule}
              disabled={creating || !streamTitle || !streamDate || !streamTime}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scheduling...
                </>
              ) : (
                "Schedule Stream"
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Scheduled Streams */}
      {scheduledStreams.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Upcoming Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{stream.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        {stream.category && (
                          <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600 text-[10px]">
                            {stream.category}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDateTime(stream.scheduledAt)}
                        </span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                          Scheduled
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {stream.price > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        ${stream.price}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleStartScheduledStream(stream)}
                      className="bg-red-500 hover:bg-red-600 text-white gap-1"
                    >
                      <Radio className="h-3 w-3" />
                      Start Stream
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Streams */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Video className="h-5 w-5 text-orange-500" />
            Past Streams
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Review your previous streams and replay analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastStreams.length === 0 && !loading ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              No past streams yet. Go live or schedule your first stream!
            </p>
          ) : (
            <div className="space-y-3">
              {pastStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-500/10">
                      <Video className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{stream.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        {stream.category && (
                          <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600 text-[10px]">
                            {stream.category}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{" "}
                          {formatDate(stream.endedAt || stream.startedAt || stream.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{" "}
                          {formatDuration(stream.startedAt, stream.endedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white flex items-center gap-1 justify-end">
                        <Eye className="h-3 w-3 text-zinc-500" /> {stream.viewerCount}
                      </p>
                    </div>
                    {stream.playbackUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        onClick={() => window.open(stream.playbackUrl!, "_blank")}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Replay
                      </Button>
                    ) : (
                      <Badge className="bg-zinc-700 text-zinc-500 border-zinc-600">
                        No Replay
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Viewer Analytics */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Viewer Analytics
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Engagement metrics across your streams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {viewerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewerData}>
                  <XAxis dataKey="stream" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="viewers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                Stream analytics will appear here after your first broadcast.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
