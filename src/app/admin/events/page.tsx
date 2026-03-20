"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  MapPin,
  Star,
  Edit3,
  Trash2,
  Video,
  Loader2,
} from "lucide-react";
import { useApi, useMutation, apiFetch } from "@/hooks/use-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventData {
  id: string;
  title: string;
  description: string | null;
  type: string; // "GROUP_CLASS" | "WORKSHOP" | "GLOBAL_EVENT" | "ONE_ON_ONE"
  startTime: string;
  endTime: string | null;
  location: string | null;
  isVirtual: boolean;
  capacity: number | null;
  price: number;
  isFeatured: boolean;
  status: string; // "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED"
  coachId: string | null;
  coach: { id: string; fullName: string; username: string } | null;
  _count: { bookings: number };
}

interface EventsResponse {
  events: EventData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateEventBody {
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime?: string;
  location: string;
  isVirtual: boolean;
  capacity: number | null;
  price: number;
  isFeatured: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapType(apiType: string): string {
  switch (apiType) {
    case "GROUP_CLASS":
      return "Group Class";
    case "WORKSHOP":
      return "Workshop";
    case "GLOBAL_EVENT":
      return "Global Event";
    case "ONE_ON_ONE":
      return "1:1 Session";
    default:
      return apiType;
  }
}

function mapStatus(apiStatus: string): string {
  switch (apiStatus) {
    case "UPCOMING":
      return "Upcoming";
    case "LIVE":
      return "Live";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return apiStatus;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  const mm = String(mins).padStart(2, "0");
  return `${h}:${mm} ${ampm}`;
}

function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "N/A";
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (diff <= 0) return "N/A";
  const totalMins = Math.round(diff / 60000);
  if (totalMins < 60) return `${totalMins} min`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hour${hrs > 1 ? "s" : ""}`;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusFilters = ["All", "Upcoming", "Live", "Completed", "Cancelled"];
const typeFilters = ["All", "Group Class", "Workshop", "Global Event", "1:1 Session"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminEventsPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("GLOBAL_EVENT");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formIsVirtual, setFormIsVirtual] = useState(false);
  const [formCapacity, setFormCapacity] = useState("");
  const [formPrice, setFormPrice] = useState("0");
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const url = useMemo(() => {
    const p = new URLSearchParams({ limit: "50" });
    return `/api/events?${p}`;
  }, []);

  const { data, loading, error, refetch } = useApi<EventsResponse>(url);

  const { mutate: createEvent, loading: creating } = useMutation<EventData, CreateEventBody>(
    "/api/events",
    "POST"
  );

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const allEvents = useMemo(() => data?.events ?? [], [data]);

  const mappedEvents = useMemo(
    () =>
      allEvents.map((event) => ({
        id: event.id,
        title: event.title,
        coach: event.coach?.fullName ?? "Admin Team",
        type: mapType(event.type),
        date: formatDate(event.startTime),
        time: formatTime(event.startTime),
        duration: formatDuration(event.startTime, event.endTime),
        location: event.location ?? (event.isVirtual ? "Virtual" : "In-Person"),
        isVirtual: event.isVirtual,
        capacity: event.capacity ?? ("∞" as const),
        registered: event._count.bookings,
        featured: event.isFeatured,
        status: mapStatus(event.status),
      })),
    [allEvents]
  );

  const filteredEvents = useMemo(
    () =>
      mappedEvents.filter((e) => {
        const matchesStatus = statusFilter === "All" || e.status === statusFilter;
        const matchesType = typeFilter === "All" || e.type === typeFilter;
        const matchesSearch =
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.coach.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesType && matchesSearch;
      }),
    [mappedEvents, statusFilter, typeFilter, searchQuery]
  );

  const totalUpcoming = useMemo(
    () => mappedEvents.filter((e) => e.status === "Upcoming" || e.status === "Live").length,
    [mappedEvents]
  );
  const totalRegistered = useMemo(
    () => mappedEvents.reduce((sum, e) => sum + e.registered, 0),
    [mappedEvents]
  );
  const totalFeatured = useMemo(
    () => mappedEvents.filter((e) => e.featured).length,
    [mappedEvents]
  );

  const [deleting, setDeleting] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleDeleteEvent(id: string) {
    setDeleting(id);
    try {
      await apiFetch(`/api/events/${id}`, { method: "DELETE" });
      refetch();
    } catch (e) {
      // silently fail — refetch will show current state
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreateEvent() {
    if (!formTitle || !formDate || !formTime) return;

    const startTime = new Date(`${formDate}T${formTime}`).toISOString();
    const endTime =
      formEndDate && formEndTime
        ? new Date(`${formEndDate}T${formEndTime}`).toISOString()
        : undefined;

    const result = await createEvent({
      title: formTitle,
      description: formDescription,
      type: formType,
      startTime,
      ...(endTime ? { endTime } : {}),
      location: formLocation,
      isVirtual: formIsVirtual,
      capacity: formCapacity ? parseInt(formCapacity) : null,
      price: parseFloat(formPrice) || 0,
      isFeatured: formIsFeatured,
    } as CreateEventBody);

    if (result) {
      setShowCreateEvent(false);
      // Reset form
      setFormTitle("");
      setFormDescription("");
      setFormType("GLOBAL_EVENT");
      setFormDate("");
      setFormTime("");
      setFormEndDate("");
      setFormEndTime("");
      setFormLocation("");
      setFormIsVirtual(false);
      setFormCapacity("");
      setFormPrice("0");
      setFormIsFeatured(false);
      refetch();
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Event Management</h1>
          <p className="text-zinc-400 mt-1">
            Manage classes, workshops, and global events.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateEvent(!showCreateEvent)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Global Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? "—" : mappedEvents.length}
                </p>
                <p className="text-sm text-zinc-400">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? "—" : totalUpcoming}
                </p>
                <p className="text-sm text-zinc-400">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? "—" : totalRegistered}
                </p>
                <p className="text-sm text-zinc-400">Total Registered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? "—" : totalFeatured}
                </p>
                <p className="text-sm text-zinc-400">Featured Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Event Form */}
      {showCreateEvent && (
        <Card className="bg-zinc-900 border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Create Global Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Event Title</label>
                <Input
                  placeholder="e.g., Gymtality 5K"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Event Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
                >
                  <option value="GLOBAL_EVENT">Global Event</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="GROUP_CLASS">Group Class</option>
                  <option value="ONE_ON_ONE">1:1 Session</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">Description</label>
              <Textarea
                placeholder="Describe the event..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Start Date</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Start Time</label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">End Date</label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">End Time</label>
                <Input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Location</label>
                <Input
                  placeholder="e.g., Multiple Cities"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Capacity</label>
                <Input
                  type="number"
                  placeholder="200"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-300">Price ($)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsVirtual}
                  onChange={(e) => setFormIsVirtual(e.target.checked)}
                  className="accent-orange-500"
                />
                Virtual Event
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                  className="accent-orange-500"
                />
                Featured
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreateEvent}
                disabled={creating || !formTitle || !formDate || !formTime}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
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

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-zinc-500" />
              {statusFilters.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
          {/* Type filter row */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <span className="text-xs text-zinc-500 mr-1">Type:</span>
            {typeFilters.map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(type)}
                className={
                  typeFilter === type
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }
              >
                {type}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading events...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
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
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const capacityNum = typeof event.capacity === "number" ? event.capacity : null;
                const fillRatio = capacityNum ? event.registered / capacityNum : null;

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/10">
                        {event.isVirtual || event.location === "Virtual" ? (
                          <Video className="h-6 w-6 text-blue-500" />
                        ) : (
                          <MapPin className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{event.title}</h4>
                          {event.featured && (
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">by {event.coach}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                          <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600 text-[10px]">
                            {event.type}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {event.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {event.time} ({event.duration})
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {event.registered}/{event.capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Attendance bar — only shown when capacity is a number */}
                      {fillRatio !== null && (
                        <div className="w-20 hidden md:block">
                          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                fillRatio >= 0.9
                                  ? "bg-red-500"
                                  : fillRatio >= 0.7
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(fillRatio * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 text-center mt-0.5">
                            {Math.round(fillRatio * 100)}% full
                          </p>
                        </div>
                      )}
                      <Badge
                        className={
                          event.status === "Upcoming"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : event.status === "Live"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : event.status === "Cancelled"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-zinc-700 text-zinc-400 border-zinc-600"
                        }
                      >
                        {event.status}
                      </Badge>
                      <button
                        className={`${
                          event.featured ? "text-amber-400" : "text-zinc-600"
                        } hover:text-amber-400 transition`}
                      >
                        <Star
                          className={`h-4 w-4 ${event.featured ? "fill-amber-400" : ""}`}
                        />
                      </button>
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
                        disabled={deleting === event.id}
                        onClick={() => handleDeleteEvent(event.id)}
                        className="border-zinc-700 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        {deleting === event.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredEvents.length === 0 && (
                <p className="text-center text-zinc-500 py-8">
                  No events matching your filters.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
