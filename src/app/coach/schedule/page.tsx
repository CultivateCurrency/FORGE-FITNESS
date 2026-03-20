"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useApi, useMutation, apiFetch } from "@/hooks/use-api";
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
  Calendar,
  Clock,
  Plus,
  Users,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const timeSlots = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM",
];

const sessionTypes = [
  { label: "1:1 Session", price: "$75", description: "Single private session", color: "text-blue-400", bg: "bg-blue-500/20" },
  { label: "4-Pack Sessions", price: "$260", description: "4 private sessions", color: "text-green-400", bg: "bg-green-500/20" },
  { label: "8-Pack Sessions", price: "$480", description: "8 private sessions", color: "text-purple-400", bg: "bg-purple-500/20" },
];

const initialAvailability: Record<string, string[]> = {
  Monday: ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM"],
  Tuesday: ["9:00 AM", "10:00 AM", "3:00 PM", "4:00 PM"],
  Wednesday: ["8:00 AM", "9:00 AM", "10:00 AM", "2:00 PM", "3:00 PM", "6:00 PM"],
  Thursday: ["9:00 AM", "10:00 AM", "11:00 AM"],
  Friday: ["8:00 AM", "9:00 AM", "10:00 AM", "2:00 PM"],
  Saturday: ["10:00 AM", "11:00 AM"],
  Sunday: [],
};

interface EventData {
  id: string;
  title: string;
  type: "LIVE_CLASS" | "IN_PERSON" | "WORKSHOP" | "APPOINTMENT" | "CHALLENGE_EVENT";
  startTime: string;
  endTime: string;
  capacity: number | null;
  location: string;
  price: number;
  _count: { bookings: number };
}

interface EventsResponse {
  events: EventData[];
  pagination: Record<string, unknown>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CoachSchedulePage() {
  const { data: session } = useSession();
  const [availability, setAvailability] = useState(initialAvailability);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventCategory, setEventCategory] = useState<EventData["type"]>("LIVE_CLASS");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDuration, setEventDuration] = useState("60");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [eventLocation, setEventLocation] = useState("Virtual");

  // Fetch events
  const {
    data: eventsData,
    loading: eventsLoading,
    error: eventsError,
    refetch,
  } = useApi<EventsResponse>("/api/events");

  // Create event mutation
  const {
    mutate: createEvent,
    loading: creating,
    error: createError,
  } = useMutation<EventData>("/api/events", "POST");

  const events = eventsData?.events ?? [];

  const toggleSlot = (day: string, time: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      if (daySlots.includes(time)) {
        return { ...prev, [day]: daySlots.filter((t) => t !== time) };
      } else {
        return { ...prev, [day]: [...daySlots, time].sort() };
      }
    });
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate || !eventTime) return;

    const startTime = new Date(`${eventDate}T${eventTime}`).toISOString();
    const endTime = new Date(
      new Date(`${eventDate}T${eventTime}`).getTime() + Number(eventDuration) * 60000
    ).toISOString();

    const result = await createEvent({
      title: eventTitle,
      type: eventCategory,
      startTime,
      endTime,
      capacity: maxParticipants ? Number(maxParticipants) : null,
      location: eventLocation,
      coachId: (session?.user as any)?.id,
    });

    if (result) {
      // Reset form and close
      setEventTitle("");
      setEventCategory("LIVE_CLASS");
      setEventDate("");
      setEventTime("");
      setEventDuration("60");
      setMaxParticipants("");
      setEventLocation("Virtual");
      setShowCreateEvent(false);
      refetch();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await apiFetch(`/api/events/${id}`, { method: "DELETE" });
      refetch();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleSaveAvailability = () => {
    alert("Availability saved! (Availability API not yet implemented)");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Schedule</h1>
          <p className="text-zinc-400 mt-1">
            Manage your availability, bookings, and classes.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateEvent(!showCreateEvent)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event / Class
        </Button>
      </div>

      {/* Session Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessionTypes.map((session) => (
          <Card key={session.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{session.label}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{session.description}</p>
                </div>
                <span className={`text-xl font-bold ${session.color}`}>
                  {session.price}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Event Form */}
      {showCreateEvent && (
        <Card className="bg-zinc-900 border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Create Event / Class
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {createError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md p-3">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Event Title</label>
                <Input
                  placeholder="e.g., Morning HIIT Class"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Category</label>
                <select
                  className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as EventData["type"])}
                >
                  <option value="LIVE_CLASS">Live Class</option>
                  <option value="IN_PERSON">In Person</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="APPOINTMENT">Appointment</option>
                  <option value="CHALLENGE_EVENT">Challenge Event</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Date</label>
                <Input
                  type="date"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Time</label>
                <Input
                  type="time"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Duration (min)</label>
                <Input
                  type="number"
                  placeholder="60"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={eventDuration}
                  onChange={(e) => setEventDuration(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Max Participants</label>
                <Input
                  type="number"
                  placeholder="20"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Location</label>
                <select
                  className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                >
                  <option>Virtual</option>
                  <option>In-Person</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleCreateEvent}
                disabled={creating || !eventTitle || !eventDate || !eventTime}
              >
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Event
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateEvent(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Availability */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Set Availability
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Click time slots to toggle availability for each day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {daysOfWeek.map((day) => (
                <div key={day}>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">{day}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {timeSlots.map((time) => {
                      const isAvailable = (availability[day] || []).includes(time);
                      return (
                        <button
                          key={`${day}-${time}`}
                          onClick={() => toggleSlot(day, time)}
                          className={`px-2 py-1 text-xs rounded-md border transition ${
                            isAvailable
                              ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                              : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                          }`}
                        >
                          {isAvailable && <Check className="h-3 w-3 inline mr-1" />}
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white w-full"
              onClick={handleSaveAvailability}
            >
              Save Availability
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Upcoming Bookings
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Your scheduled sessions and classes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading && (
              <div className="flex items-center justify-center py-8 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading events...
              </div>
            )}
            {eventsError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md p-3">
                <AlertCircle className="h-4 w-4" />
                {eventsError}
              </div>
            )}
            {!eventsLoading && !eventsError && events.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-8">
                No upcoming events. Create one to get started!
              </p>
            )}
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{event.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{formatEventType(event.type)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {event._count.bookings}/{event.capacity ?? "--"} booked
                      </Badge>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(event.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTime(event.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      {event.location === "Virtual" ? (
                        <Video className="h-3 w-3" />
                      ) : (
                        <MapPin className="h-3 w-3" />
                      )}
                      {event.location}
                    </span>
                    {event.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {event._count.bookings}/{event.capacity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View Placeholder */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Calendar View
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-zinc-300 font-medium">March 2026</span>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
            Full calendar view will be integrated here (e.g., react-big-calendar)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
