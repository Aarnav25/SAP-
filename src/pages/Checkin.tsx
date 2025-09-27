import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EventItem = {
  id: number;
  name: string;
  schedule?: { startDate?: string };
  date?: string;
};

const buildPayloadBase64 = (data: any) => {
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
};

const Checkin = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState<string>("");
  const [role, setRole] = useState<string>("participant");
  const [name, setName] = useState<string>("");
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        const json = await res.json();
        if (json?.success) setEvents(json.data);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedEvent = useMemo(() => events.find(e => String(e.id) === String(eventId)), [events, eventId]);
  const payload = useMemo(() => ({ eventId: Number(eventId) || undefined, role, name: name || undefined }), [eventId, role, name]);
  const payloadB64 = useMemo(() => buildPayloadBase64(payload), [payload]);
  const qrUrl = useMemo(() => {
    const data = encodeURIComponent(payloadB64);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`;
  }, [payloadB64]);

  const doCheckin = async () => {
    try {
      setResult("");
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: payloadB64, // compact QR style
          // also send explicit for robustness
          eventId: Number(eventId) || undefined, role, name: name || undefined,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setResult("Check-in successful!");
      } else {
        setResult(json?.error || "Failed to check in");
      }
    } catch (e: any) {
      setResult(e?.message || "Network error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">QR Code Check-in</h1>
          <p className="text-muted-foreground">Generate a QR for volunteers/participants and record check-ins.</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Organizer: Generate QR</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Select Event</label>
              <Select value={eventId} onValueChange={(v) => setEventId(v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={loading ? "Loading..." : "Choose an event"} /></SelectTrigger>
                <SelectContent>
                  {events.map(ev => (
                    <SelectItem key={ev.id} value={String(ev.id)}>
                      {ev.name} {ev.schedule?.startDate ? `(${ev.schedule.startDate})` : ev.date ? `(${ev.date})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">Participant</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Name (optional)</label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="flex items-center gap-4 mt-4">
              <img src={qrUrl} alt="QR Code" className="rounded border" />
              <div className="text-xs break-all text-muted-foreground">
                <div className="font-medium text-foreground">QR Payload (base64)</div>
                {payloadB64}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Participant: Scan / Submit</h2>
          <p className="text-sm text-muted-foreground mb-3">On a real setup, scanning the QR would open a link that posts this payload to the server. For the hackathon demo, click the button to submit.</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">QR Payload (base64)</label>
              <Input className="mt-1" value={payloadB64} onChange={() => {}} readOnly />
            </div>
            <Button onClick={doCheckin}>Submit Check-in</Button>
            {result && <p className="text-sm mt-2">{result}</p>}
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h2 className="font-semibold text-lg mb-4">Recent Check-ins</h2>
          <CheckinsList eventId={eventId ? Number(eventId) : undefined} />
        </Card>
      </main>
    </div>
  );
};

const CheckinsList = ({ eventId }: { eventId?: number }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const url = eventId ? `/api/checkins?eventId=${eventId}` : "/api/checkins";
      const res = await fetch(url);
      const json = await res.json();
      if (json?.success) setItems(json.data);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${items.length} check-ins`}</p>
        <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((c) => (
          <Card key={c.id} className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{c.name || "Anonymous"}</div>
                <div className="text-muted-foreground">{c.role} • Event #{c.eventId}</div>
              </div>
              <div className="text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleString()}</div>
            </div>
          </Card>
        ))}
        {!items.length && !loading && <p className="text-muted-foreground text-sm">No check-ins yet.</p>}
      </div>
    </div>
  );
};

export default Checkin;
