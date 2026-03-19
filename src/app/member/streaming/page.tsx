"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useApi } from "@/hooks/use-api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Radio,
  Play,
  Clock,
  Eye,
  Video,
  CalendarDays,
  Loader2,
  ArrowLeft,
  User,
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
  playbackUrl: string | null;
  createdAt: string;
  host?: { id: string; fullName: string; profilePhoto: string | null };
}

const ACCESS_STYLES: Record<string, string> = {
  PUBLIC: "bg-green-500/20 text-green-400 border-green-500/30",
  MEMBERS_ONLY: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PAY_PER_VIEW: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  GROUP_ONLY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const ACCESS_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  MEMBERS_ONLY: "Members Only",
  PAY_PER_VIEW: "Pay Per View",
  GROUP_ONLY: "Group Only",
};

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return "";
  const diff = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
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

// IVS Player Component
function IvsPlayer({ playbackUrl, autoplay = true }: { playbackUrl: string; autoplay?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    if (!playbackUrl) return;

    // Load the Amazon IVS Player SDK from CDN
    const script = document.createElement("script");
    script.src = "https://player.live-video.net/1.24.0/amazon-ivs-player.min.js";
    script.async = true;

    script.onload = () => {
      try {
        const IVSPlayer = (window as any).IVSPlayer;
        if (!IVSPlayer || !IVSPlayer.isPlayerSupported) {
          setPlayerError("IVS Player is not supported in this browser.");
          return;
        }

        const player = IVSPlayer.create();
        playerRef.current = player;
        player.attachHTMLVideoElement(videoRef.current!);
        player.load(playbackUrl);
        if (autoplay) player.play();

        player.addEventListener(IVSPlayer.PlayerState.PLAYING, () => {
          setPlayerLoaded(true);
        });

        player.addEventListener(IVSPlayer.PlayerEventType.ERROR, (err: any) => {
          console.error("IVS Player error:", err);
          if (!playerLoaded) {
            setPlayerError("Stream is not currently broadcasting.");
          }
        });
      } catch (err) {
        console.error("Failed to initialize IVS player:", err);
        setPlayerError("Failed to load video player.");
      }
    };

    script.onerror = () => {
      setPlayerError("Failed to load video player SDK.");
    };

    document.head.appendChild(script);

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.delete();
        } catch (e) {}
      }
      script.remove();
    };
  }, [playbackUrl, autoplay]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        muted={autoplay}
        controls
      />
      {!playerLoaded && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">Connecting to stream...</p>
          </div>
        </div>
      )}
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <Video className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">{playerError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StreamCard({
  stream,
  isLive,
  onWatch,
}: {
  stream: Stream;
  isLive?: boolean;
  onWatch: (stream: Stream) => void;
}) {
  const duration = formatDuration(stream.startedAt, stream.endedAt);

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition group">
      <CardContent className="pt-4 space-y-3">
        {/* Thumbnail */}
        <div
          className="relative h-40 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => onWatch(stream)}
        >
          <Video className="h-10 w-10 text-zinc-600" />
          {isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-xs font-bold text-white">
              <Radio className="h-3 w-3 animate-pulse" />
              LIVE
            </div>
          )}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
              {duration}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
            <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white text-sm leading-tight">{stream.title}</h3>
            <Badge className={`shrink-0 text-[10px] ${ACCESS_STYLES[stream.type] || ""}`}>
              {ACCESS_LABELS[stream.type] || stream.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center">
              {stream.host?.profilePhoto ? (
                <img src={stream.host.profilePhoto} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <User className="h-3 w-3 text-zinc-400" />
              )}
            </div>
            <p className="text-sm text-zinc-400">{stream.host?.fullName || "Coach"}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {isLive && (
              <span className="flex items-center gap-1 text-red-400">
                <Eye className="h-3 w-3" />
                {stream.viewerCount} watching
              </span>
            )}
            {!isLive && stream.viewerCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {stream.viewerCount.toLocaleString()} views
              </span>
            )}
            {stream.status === "SCHEDULED" && stream.scheduledAt && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDateTime(stream.scheduledAt)}
              </span>
            )}
            {stream.category && (
              <Badge className="bg-zinc-700/50 text-zinc-400 border-zinc-600 text-[10px]">
                {stream.category}
              </Badge>
            )}
            {stream.price > 0 && (
              <span className="text-amber-400 font-semibold">${stream.price}</span>
            )}
          </div>
        </div>

        <Button
          onClick={() => onWatch(stream)}
          className={`w-full ${
            isLive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
        >
          {isLive ? "Join Stream" : stream.price > 0 ? `Buy — $${stream.price}` : "Watch"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StreamingPage() {
  const { data: session } = useSession();
  const [watchingStream, setWatchingStream] = useState<Stream | null>(null);

  // Fetch all streams by status
  const { data: liveData, loading: loadingLive } = useApi<{ streams: Stream[] }>(
    "/api/streaming?status=LIVE&limit=20"
  );
  const { data: scheduledData, loading: loadingScheduled } = useApi<{ streams: Stream[] }>(
    "/api/streaming?status=SCHEDULED&limit=20"
  );
  const { data: endedData, loading: loadingEnded } = useApi<{ streams: Stream[] }>(
    "/api/streaming?status=ENDED&limit=20"
  );

  const liveStreams = liveData?.streams ?? [];
  const scheduledStreams = scheduledData?.streams ?? [];
  const endedStreams = endedData?.streams ?? [];

  function handleWatch(stream: Stream) {
    setWatchingStream(stream);
  }

  // Watching view
  if (watchingStream) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white gap-2"
          onClick={() => setWatchingStream(null)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Streams
        </Button>

        {/* Video Player */}
        {watchingStream.playbackUrl ? (
          <IvsPlayer playbackUrl={watchingStream.playbackUrl} />
        ) : (
          <div className="w-full aspect-video bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
            <div className="text-center">
              <Video className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">
                {watchingStream.status === "SCHEDULED"
                  ? "This stream hasn't started yet."
                  : "Playback is not available for this stream."}
              </p>
              {watchingStream.status === "SCHEDULED" && watchingStream.scheduledAt && (
                <p className="text-zinc-500 text-sm mt-1">
                  Starts {formatDateTime(watchingStream.scheduledAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stream Info */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {watchingStream.status === "LIVE" && (
                    <Badge className="bg-red-600 text-white border-red-500 gap-1">
                      <Radio className="h-3 w-3 animate-pulse" /> LIVE
                    </Badge>
                  )}
                  <Badge className={ACCESS_STYLES[watchingStream.type] || ""}>
                    {ACCESS_LABELS[watchingStream.type] || watchingStream.type}
                  </Badge>
                  {watchingStream.category && (
                    <Badge className="bg-zinc-700/50 text-zinc-400 border-zinc-600">
                      {watchingStream.category}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white">{watchingStream.title}</h1>
              </div>
              <div className="text-right text-sm text-zinc-400">
                <p className="flex items-center gap-1 justify-end">
                  <Eye className="h-4 w-4" /> {watchingStream.viewerCount} {watchingStream.status === "LIVE" ? "watching" : "views"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
              <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center">
                {watchingStream.host?.profilePhoto ? (
                  <img src={watchingStream.host.profilePhoto} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-zinc-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">{watchingStream.host?.fullName || "Coach"}</p>
                <p className="text-xs text-zinc-500">
                  {watchingStream.status === "LIVE" && watchingStream.startedAt
                    ? `Started ${formatDateTime(watchingStream.startedAt)}`
                    : watchingStream.status === "ENDED"
                    ? `Streamed ${formatDateTime(watchingStream.startedAt)}`
                    : `Scheduled for ${formatDateTime(watchingStream.scheduledAt)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Browse view
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Live Streaming</h1>
        <p className="text-zinc-400 mt-1">Watch live workouts, replays, and exclusive content.</p>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="live" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Radio className="h-4 w-4 mr-2" />
            Live Now
            {liveStreams.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{liveStreams.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Clock className="h-4 w-4 mr-2" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="ondemand" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Play className="h-4 w-4 mr-2" />
            On Demand
          </TabsTrigger>
        </TabsList>

        {/* Live Now */}
        <TabsContent value="live" className="mt-4">
          {loadingLive ? (
            <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading streams...
            </div>
          ) : liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} isLive onWatch={handleWatch} />
              ))}
            </div>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <Radio className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No live streams right now. Check back soon!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upcoming */}
        <TabsContent value="upcoming" className="mt-4">
          {loadingScheduled ? (
            <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading...
            </div>
          ) : scheduledStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} onWatch={handleWatch} />
              ))}
            </div>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <Clock className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No upcoming streams scheduled.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* On Demand */}
        <TabsContent value="ondemand" className="mt-4">
          {loadingEnded ? (
            <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading...
            </div>
          ) : endedStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {endedStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} onWatch={handleWatch} />
              ))}
            </div>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <Video className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No replays available yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
