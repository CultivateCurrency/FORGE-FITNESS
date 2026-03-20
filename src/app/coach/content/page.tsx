"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useApi, useMutation, apiFetch } from "@/hooks/use-api";
import { useUpload } from "@/hooks/use-upload";
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
  Upload,
  Plus,
  Dumbbell,
  Video,
  CheckCircle2,
  Brain,
  Leaf,
  Apple,
  BookOpen,
  Stethoscope,
  Clock,
  Eye,
  MoreVertical,
  Trash2,
  Edit3,
  Loader2,
} from "lucide-react";

const categories = [
  { label: "Workouts", icon: Dumbbell },
  { label: "Meditation", icon: Brain },
  { label: "Yoga", icon: Leaf },
  { label: "Healthy Foods", icon: Apple },
  { label: "Books", icon: BookOpen },
  { label: "Psychiatrist", icon: Stethoscope },
];

const difficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

const bodyParts = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Core",
  "Legs",
  "Glutes",
  "Full Body",
];

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  type: "HOME" | "GYM";
  category: string;
  difficulty: string;
  repetitions: boolean;
  createdAt: string;
  coach: { id: string; fullName: string };
  _count: { likes: number; saves: number; sessions: number };
}

interface WorkoutsResponse {
  plans: WorkoutPlan[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function CoachContentPage() {
  const { data: session } = useSession();
  const { data: workoutsData, loading, error, refetch } = useApi<WorkoutsResponse>("/api/workouts");
  const { mutate: publishPlan, loading: publishing, error: publishError } = useMutation<WorkoutPlan>("/api/workouts", "POST");
  const { upload, uploading: uploadingVideo } = useUpload();

  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planType, setPlanType] = useState<"HOME" | "GYM">("HOME");
  const [selectedCategory, setSelectedCategory] = useState("Workouts");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [repetitions, setRepetitions] = useState(false);
  const [exercises, setExercises] = useState([
    { name: "", description: "", bodyParts: [] as string[], equipment: "", duration: "", sets: "", reps: "", videoUrl: "" },
  ]);

  const updateExercise = (index: number, field: string, value: string | string[]) => {
    setExercises(exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)));
  };

  const toggleExerciseBodyPart = (index: number, part: string) => {
    const ex = exercises[index];
    const parts = ex.bodyParts.includes(part)
      ? ex.bodyParts.filter((p) => p !== part)
      : [...ex.bodyParts, part];
    updateExercise(index, "bodyParts", parts);
  };

  const handleVideoUpload = async (index: number, file: File) => {
    try {
      const result = await upload(file, "exercise-videos", "video");
      updateExercise(index, "videoUrl", result.url);
    } catch {
      // error displayed by hook
    }
  };

  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: "", description: "", bodyParts: [], equipment: "", duration: "", sets: "", reps: "", videoUrl: "" },
    ]);
  };

  const handlePublish = async () => {
    if (!planName.trim()) return;
    const result = await publishPlan({
      coachId: (session?.user as any)?.id,
      name: planName,
      description: planDescription,
      type: planType,
      category: selectedCategory,
      difficulty,
      repetitions,
    });
    if (result) {
      // Add exercises to the newly created plan
      const validExercises = exercises.filter((ex) => ex.name.trim());
      if (validExercises.length > 0) {
        try {
          await apiFetch(`/api/workouts/${result.id}/exercises`, {
            method: "POST",
            body: JSON.stringify({
              exercises: validExercises.map((ex, i) => ({
                name: ex.name,
                description: ex.description || undefined,
                bodyParts: ex.bodyParts,
                equipment: ex.equipment || undefined,
                duration: ex.duration ? Number(ex.duration) : undefined,
                sets: ex.sets ? Number(ex.sets) : undefined,
                reps: ex.reps ? Number(ex.reps) : undefined,
                videoUrl: ex.videoUrl || undefined,
                order: i + 1,
              })),
            }),
          });
        } catch (err) {
          console.error("Failed to add exercises:", err);
        }
      }
      setPlanName("");
      setPlanDescription("");
      setPlanType("HOME");
      setSelectedCategory("Workouts");
      setDifficulty("Beginner");
      setRepetitions(false);
      setExercises([{ name: "", description: "", bodyParts: [], equipment: "", duration: "", sets: "", reps: "", videoUrl: "" }]);
      refetch();
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await apiFetch(`/api/workouts/${id}`, { method: "DELETE" });
      refetch();
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  const plans = workoutsData?.plans ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Content Upload</h1>
        <p className="text-zinc-400 mt-1">
          Create and manage your workout plans, exercises, and content.
        </p>
      </div>

      {/* Upload Category Selection */}
      <div>
        <h2 className="text-sm font-medium text-zinc-300 mb-3">Upload to Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${
                selectedCategory === cat.label
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <cat.icon
                className={`h-6 w-6 ${
                  selectedCategory === cat.label ? "text-orange-500" : "text-zinc-400"
                }`}
              />
              <span
                className={`text-sm ${
                  selectedCategory === cat.label ? "text-orange-500 font-medium" : "text-zinc-400"
                }`}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Workout Plan Form */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-500" />
            Upload Workout Plan
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Fill out the details below to create a new plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Name */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Plan Name</label>
            <Input
              placeholder="e.g., Full Body Shred - 12 Week"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Description</label>
            <Textarea
              placeholder="Describe your workout plan..."
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
            />
          </div>

          {/* Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Type</label>
            <div className="flex gap-2">
              <Button
                variant={planType === "HOME" ? "default" : "outline"}
                onClick={() => setPlanType("HOME")}
                className={
                  planType === "HOME"
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }
              >
                HOME
              </Button>
              <Button
                variant={planType === "GYM" ? "default" : "outline"}
                onClick={() => setPlanType("GYM")}
                className={
                  planType === "GYM"
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }
              >
                GYM
              </Button>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.label} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Difficulty</label>
            <div className="flex gap-2 flex-wrap">
              {difficultyLevels.map((level) => (
                <Button
                  key={level}
                  variant={difficulty === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDifficulty(level)}
                  className={
                    difficulty === level
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Repetitions Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
            <div>
              <p className="text-sm text-zinc-300">Repeating Plan</p>
              <p className="text-xs text-zinc-500">Plan repeats on a weekly cycle</p>
            </div>
            <button
              onClick={() => setRepetitions(!repetitions)}
              className={`w-12 h-6 rounded-full transition ${
                repetitions ? "bg-orange-500" : "bg-zinc-700"
              } relative`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${
                  repetitions ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Add Exercises Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-orange-500" />
            Exercises
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Add exercises to your workout plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {exercises.map((exercise, index) => (
            <div
              key={index}
              className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-orange-500">
                  Exercise {index + 1}
                </h4>
                {exercises.length > 1 && (
                  <button
                    onClick={() =>
                      setExercises(exercises.filter((_, i) => i !== index))
                    }
                    className="text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300">Exercise Name</label>
                  <Input
                    placeholder="e.g., Barbell Squat"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, "name", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300">Equipment</label>
                  <Input
                    placeholder="e.g., Barbell, Dumbbells"
                    value={exercise.equipment}
                    onChange={(e) => updateExercise(index, "equipment", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Description</label>
                <Textarea
                  placeholder="Describe proper form and instructions..."
                  value={exercise.description}
                  onChange={(e) => updateExercise(index, "description", e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
                />
              </div>

              {/* Target Body Parts */}
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Target Body Parts</label>
                <div className="flex gap-2 flex-wrap">
                  {bodyParts.map((part) => (
                    <Badge
                      key={part}
                      onClick={() => toggleExerciseBodyPart(index, part)}
                      className={`cursor-pointer border ${
                        exercise.bodyParts.includes(part)
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : "bg-zinc-700 text-zinc-300 hover:bg-orange-500/20 hover:text-orange-400 border-zinc-600"
                      }`}
                    >
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300">Duration (min)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={exercise.duration}
                    onChange={(e) => updateExercise(index, "duration", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300">Sets</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(index, "sets", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300">Reps</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(index, "reps", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              {/* Video Upload */}
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Exercise Video</label>
                {exercise.videoUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-green-500/30">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-sm text-green-400 truncate flex-1">Video uploaded</p>
                    <button
                      onClick={() => updateExercise(index, "videoUrl", "")}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor={`video-${index}`}
                    className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-orange-500/50 transition cursor-pointer block"
                  >
                    {uploadingVideo ? (
                      <Loader2 className="h-8 w-8 text-orange-500 mx-auto mb-2 animate-spin" />
                    ) : (
                      <Video className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-zinc-400">
                      {uploadingVideo ? "Uploading..." : "Click to upload or drag & drop"}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">MP4, MOV up to 500MB</p>
                    <input
                      id={`video-${index}`}
                      type="file"
                      accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoUpload(index, file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}

          <Button
            onClick={addExercise}
            variant="outline"
            className="w-full border-dashed border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-orange-500/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>

          {publishError && (
            <p className="text-sm text-red-400 text-center">{publishError}</p>
          )}

          <Button
            onClick={handlePublish}
            disabled={publishing || !planName.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {publishing ? "Publishing..." : "Publish Plan"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Plans */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">My Uploaded Plans</CardTitle>
          <CardDescription className="text-zinc-400">
            Manage your existing content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
              <span className="ml-2 text-zinc-400">Loading plans...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{error}</p>
              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                className="mt-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Retry
              </Button>
            </div>
          ) : plans.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No plans uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Dumbbell className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{plan.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge
                          className={
                            plan.type === "GYM"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }
                        >
                          {plan.type}
                        </Badge>
                        <span className="text-xs text-zinc-500">{plan.category}</span>
                        <span className="text-xs text-zinc-500">{plan.difficulty}</span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {plan._count.sessions}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                    <button className="text-zinc-500 hover:text-zinc-300 transition">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-zinc-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
