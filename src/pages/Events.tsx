import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

type EventItem = { id: string | number; name: string; date?: string | null; description?: string; status?: string; organiser?: { name?: string }; createdAt?: string };

const Events = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    eventName: string;
    eventType: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    location: string;
    isVirtual: boolean;
    expectedParticipants: string;
    targetAudience: string;
    registrationRequired: boolean;
    registrationType: "" | "free" | "paid";
    registrationUrl: string;
    mainTasks: string;
    resourcesNeeded: string;
    totalBudget: string;
    budgetAllocation: string;
    commsPlan: string;
    headName: string;
    headRole: string;
    members: { name: string; role: string }[];
  }>({
    eventName: "",
    eventType: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    isVirtual: false,
    expectedParticipants: "",
    targetAudience: "",
    registrationRequired: false,
    registrationType: "",
    registrationUrl: "",
    mainTasks: "",
    resourcesNeeded: "",
    totalBudget: "",
    budgetAllocation: "",
    commsPlan: "",
    headName: "",
    headRole: "",
    members: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  
  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data?.success) setEvents(data.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }
  
  async function updateEventStatus(id: string | number, status: string) {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data?.success) {
        setEvents(prev => prev.map(ev => (ev.id === id ? { ...ev, status } : ev)));
      }
    } catch (e) {
      // noop
    }
  }

  function onDragStart(ev: React.DragEvent<HTMLDivElement>, id: string | number) {
    setDraggingId(id);
    ev.dataTransfer.setData("text/plain", String(id));
    ev.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }

  function onDrop(ev: React.DragEvent<HTMLDivElement>, targetStatus: string) {
    ev.preventDefault();
    const raw = ev.dataTransfer.getData("text/plain");
    const id = raw || (draggingId != null ? String(draggingId) : "");
    if (!id) return;
    const event = events.find(x => String(x.id) === id);
    if (!event) return;
    if (event.status === targetStatus) return;
    updateEventStatus(event.id, targetStatus);
    setDraggingId(null);
  }

  const planned = events.filter(ev => (ev.status || 'planned') === 'planned');
  const inProgress = events.filter(ev => ev.status === 'in_progress');
  const completed = events.filter(ev => ev.status === 'completed');

  useEffect(() => {
    load();
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.eventName.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.eventName.trim(),
          type: form.eventType || "",
          schedule: {
            startDate: form.startDate || null,
            endDate: form.endDate || null,
            startTime: form.startTime || null,
            endTime: form.endTime || null,
            location: form.location || "",
            isVirtual: !!form.isVirtual,
          },
          expectedParticipants: form.expectedParticipants ? Number(form.expectedParticipants) : null,
          targetAudience: form.targetAudience || "",
          registration: {
            required: !!form.registrationRequired,
            type: form.registrationType || null,
            url: form.registrationUrl || "",
          },
          mainTasks: form.mainTasks || "",
          resourcesNeeded: form.resourcesNeeded || "",
          budget: {
            total: form.totalBudget ? Number(form.totalBudget) : null,
            allocation: form.budgetAllocation || "",
          },
          commsPlan: form.commsPlan || "",
          head: form.headName.trim() ? { name: form.headName.trim(), role: form.headRole.trim() } : undefined,
          members: (form.members || []).filter(m => m.name.trim()).map(m => ({ name: m.name.trim(), role: m.role.trim() })),
          status: "planned",
        }),
      });
      const data = await res.json();
      if (data?.success) {
        // Ensure we reload from backend (Mongo/in-memory) for consistent state
        await load();
        setForm({
          eventName: "",
          eventType: "",
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          location: "",
          isVirtual: false,
          expectedParticipants: "",
          targetAudience: "",
          registrationRequired: false,
          registrationType: "",
          registrationUrl: "",
          mainTasks: "",
          resourcesNeeded: "",
          totalBudget: "",
          budgetAllocation: "",
          commsPlan: "",
          headName: "",
          headRole: "",
          members: [],
        });
        setShowForm(false);
      } else {
        setError(data?.error || "Failed to create event");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1">Manage upcoming and past events.</p>
          </div>
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Close" : "New Event"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Event</CardTitle>
              <CardDescription>Provide basic details to add a new event.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-6" onSubmit={createEvent}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="eventName">What is the name of the event?</Label>
                    <Input id="eventName" placeholder="e.g., SIT 2025" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="eventType">What type of event is it?</Label>
                    <Input id="eventType" placeholder="Conference / Workshop / Meetup / ..." value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">When will it start? (Date)</Label>
                    <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">When will it end? (Date)</Label>
                    <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Where will it take place? (Location or Virtual)</Label>
                    <Input id="location" placeholder="Venue / URL" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input id="isVirtual" type="checkbox" checked={form.isVirtual} onChange={(e) => setForm({ ...form, isVirtual: e.target.checked })} />
                  <Label htmlFor="isVirtual">Is this a virtual event?</Label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expectedParticipants">How many participants are expected?</Label>
                    <Input id="expectedParticipants" type="number" min="0" value={form.expectedParticipants} onChange={(e) => setForm({ ...form, expectedParticipants: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetAudience">Who is the target audience?</Label>
                    <Input id="targetAudience" placeholder="Students, Developers, etc." value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <input id="registrationRequired" type="checkbox" checked={form.registrationRequired} onChange={(e) => setForm({ ...form, registrationRequired: e.target.checked })} />
                    <Label htmlFor="registrationRequired">Is registration required?</Label>
                  </div>
                  {form.registrationRequired && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="registrationType">Registration type</Label>
                        <select id="registrationType" className="border rounded-md h-10 px-3 bg-transparent" value={form.registrationType} onChange={(e) => setForm({ ...form, registrationType: e.target.value as any })}>
                          <option value="">Select</option>
                          <option value="free">Free</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="registrationUrl">Registration URL</Label>
                        <Input id="registrationUrl" placeholder="https://..." value={form.registrationUrl} onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mainTasks">What are the main tasks required?</Label>
                  <Textarea id="mainTasks" placeholder="List key tasks or milestones" value={form.mainTasks} onChange={(e) => setForm({ ...form, mainTasks: e.target.value })} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="resourcesNeeded">What resources or equipment are needed?</Label>
                  <Textarea id="resourcesNeeded" placeholder="Venue, projectors, catering, staff, etc." value={form.resourcesNeeded} onChange={(e) => setForm({ ...form, resourcesNeeded: e.target.value })} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="totalBudget">What is the total budget?</Label>
                    <Input id="totalBudget" type="number" min="0" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="budgetAllocation">How is it allocated?</Label>
                    <Textarea id="budgetAllocation" placeholder="Brief breakdown (e.g., venue, catering, marketing)" value={form.budgetAllocation} onChange={(e) => setForm({ ...form, budgetAllocation: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="commsPlan">How will communication and notifications be handled?</Label>
                  <Textarea id="commsPlan" placeholder="Email, WhatsApp, Slack, SMS; include frequency and audiences" value={form.commsPlan} onChange={(e) => setForm({ ...form, commsPlan: e.target.value })} />
                </div>

                <div>
                  <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Event"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Planned */}
          <Card onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'planned')}>
            <CardHeader>
              <CardTitle>Planned</CardTitle>
              <CardDescription>Not started yet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 min-h-[200px]">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : planned.length === 0 ? (
                <div className="text-sm text-muted-foreground">No planned events</div>
              ) : (
                planned.map(ev => (
                  <div
                    key={ev.id}
                    className="p-3 border rounded-md bg-background hover:shadow-sm cursor-move"
                    draggable
                    onDragStart={(e) => onDragStart(e, ev.id)}
                  >
                    <div className="font-medium text-foreground">{ev.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ev.date ? new Date(ev.date).toDateString() : 'TBD'}
                      {ev.organiser?.name ? ` • ${ev.organiser.name}` : ''}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'in_progress')}>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
              <CardDescription>Ongoing execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 min-h-[200px]">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : inProgress.length === 0 ? (
                <div className="text-sm text-muted-foreground">No ongoing events</div>
              ) : (
                inProgress.map(ev => (
                  <div
                    key={ev.id}
                    className="p-3 border rounded-md bg-background hover:shadow-sm cursor-move"
                    draggable
                    onDragStart={(e) => onDragStart(e, ev.id)}
                  >
                    <div className="font-medium text-foreground">{ev.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ev.date ? new Date(ev.date).toDateString() : 'TBD'}
                      {ev.organiser?.name ? ` • ${ev.organiser.name}` : ''}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Completed */}
          <Card onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'completed')}>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Finished events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 min-h-[200px]">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : completed.length === 0 ? (
                <div className="text-sm text-muted-foreground">No completed events</div>
              ) : (
                completed.map(ev => (
                  <div
                    key={ev.id}
                    className="p-3 border rounded-md bg-background hover:shadow-sm cursor-move"
                    draggable
                    onDragStart={(e) => onDragStart(e, ev.id)}
                  >
                    <div className="font-medium text-foreground">{ev.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ev.date ? new Date(ev.date).toDateString() : 'No date'}
                      {ev.organiser?.name ? ` • ${ev.organiser.name}` : ''}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Events;
