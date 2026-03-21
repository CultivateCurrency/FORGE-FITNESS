"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Edit,
  Dumbbell,
  BookOpen,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  Video,
  Loader2,
} from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profilePhoto: string | null;
  role: string;
  bio?: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  _count?: { likes: number; comments: number };
  createdAt: string;
}

interface WorkoutSession {
  id: string;
  workoutPlan?: { title: string };
  duration: number;
  forgeScore: number;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, workouts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [userRes, postsRes, workoutsRes, followRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/community/posts?mine=true&limit=20"),
          fetch("/api/workouts/sessions?limit=20"),
          fetch("/api/users/me/stats"),
        ]);

        const userData = await userRes.json();
        if (userData.success) {
          setProfile(userData.data);
        }

        const postsData = await postsRes.json();
        if (postsData.success) {
          setPosts(postsData.data || []);
        }

        const workoutsData = await workoutsRes.json();
        if (workoutsData.success) {
          setWorkouts(workoutsData.data || []);
        }

        const followData = await followRes.json();
        if (followData.success) {
          setStats({
            posts: postsData.data?.length || 0,
            followers: followData.data?.followers || 0,
            following: followData.data?.following || 0,
            workouts: workoutsData.data?.length || 0,
          });
        } else {
          setStats({
            posts: postsData.data?.length || 0,
            followers: 0,
            following: 0,
            workouts: workoutsData.data?.length || 0,
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center h-[60vh]">
        <p className="text-zinc-400">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              {profile.profilePhoto && (
                <AvatarImage src={profile.profilePhoto} alt={profile.fullName} />
              )}
              <AvatarFallback className="bg-orange-500/20 text-orange-500 text-3xl font-bold">
                {profile.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.fullName}</h1>
                  <p className="text-zinc-400 text-sm">@{profile.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => router.push("/member/settings")}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={() => router.push("/member/settings")}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {profile.bio && (
                <p className="text-zinc-300 text-sm leading-relaxed">{profile.bio}</p>
              )}
              <p className="text-xs text-zinc-500">
                Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800">
            {[
              { label: "Posts", value: stats.posts },
              { label: "Followers", value: stats.followers },
              { label: "Following", value: stats.following },
              { label: "Workouts", value: stats.workouts },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 w-full">
          <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Posts
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Workouts
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          {posts.length === 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 pb-6 text-center">
                <ImageIcon className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No posts yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => router.push("/member/community")}
                >
                  Create your first post
                </Button>
              </CardContent>
            </Card>
          )}
          {posts.map((post) => (
            <Card key={post.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4 space-y-3">
                {post.title && <h3 className="font-semibold text-white">{post.title}</h3>}
                <p className="text-sm text-zinc-300">{post.content}</p>
                {post.mediaUrl && (
                  <div className="rounded-lg overflow-hidden">
                    {post.mediaType === "VIDEO" ? (
                      <video src={post.mediaUrl} controls className="w-full max-h-64 object-cover" />
                    ) : (
                      <img src={post.mediaUrl} alt="" className="w-full max-h-64 object-cover" />
                    )}
                  </div>
                )}
                <div className="flex items-center gap-6 pt-2 border-t border-zinc-800 text-sm">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Heart className="h-4 w-4" />
                    {post._count?.likes || 0}
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <MessageCircle className="h-4 w-4" />
                    {post._count?.comments || 0}
                  </span>
                  <span className="text-zinc-500 ml-auto text-xs">{formatDate(post.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Workouts Tab */}
        <TabsContent value="workouts" className="mt-4 space-y-4">
          {workouts.length === 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 pb-6 text-center">
                <Dumbbell className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No workouts logged yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => router.push("/member/workouts")}
                >
                  Browse workouts
                </Button>
              </CardContent>
            </Card>
          )}
          {workouts.map((workout) => (
            <Card key={workout.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Dumbbell className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {workout.workoutPlan?.title || "Workout Session"}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {workout.duration} min &middot; Forge Score: {workout.forgeScore}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(workout.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
