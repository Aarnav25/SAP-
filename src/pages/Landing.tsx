import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Brain, 
  Calendar, 
  BarChart3, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Target,
  Zap,
  Twitter,
  Instagram,
  MessageCircle
} from "lucide-react";
// hero image now uses a remote URL, no local import required

const Landing = () => {
  // Calendar and events state
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const res = await fetch("/api/events");
        const json = await res.json();
        if (json?.success) {
          setEvents(Array.isArray(json.data) ? json.data : []);
        } else {
          setEvents([]);
        }
      } catch (e) {
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Normalize events to a map keyed by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const ev of events) {
      const dateStr = (ev?.schedule?.startDate || ev?.date || "").slice(0, 10);
      if (!dateStr) continue;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(ev);
    }
    return map;
  }, [events]);

  // Build current month grid
  const monthLabel = useMemo(() => month.toLocaleString(undefined, { month: "long", year: "numeric" }), [month]);
  const days = useMemo(() => {
    const firstDay = new Date(month);
    const startWeekday = firstDay.getDay(); // 0-6, Sun-Sat
    const prevDays = startWeekday; // number of blanks before month start
    const lastDayDate = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null; key: string }[] = [];
    // Leading blanks
    for (let i = 0; i < prevDays; i++) cells.push({ date: null, key: `b-${i}` });
    // Month days
    for (let d = 1; d <= lastDayDate; d++) {
      const dt = new Date(month.getFullYear(), month.getMonth(), d);
      cells.push({ date: dt, key: `d-${d}` });
    }
    // Trailing blanks to complete rows
    while (cells.length % 7 !== 0) cells.push({ date: null, key: `t-${cells.length}` });
    return cells;
  }, [month]);

  const changeMonth = (delta: number) => {
    const m = new Date(month);
    m.setMonth(m.getMonth() + delta);
    setMonth(m);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Graphical background accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[350px] w-[350px] rounded-full bg-muted/30 blur-3xl" />
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">HELLO WORLD</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">Events</Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link>
            <Link to="/gallery" className="text-muted-foreground hover:text-foreground transition-colors">Gallery</Link>
            <Link to="/what-we-do" className="text-muted-foreground hover:text-foreground transition-colors">What We Do</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 bg-gradient-primary bg-clip-text text-transparent">
              AI-Powered Event &amp; Task Management for Organizers
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Plan smarter, predict delays, optimize resources. Transform your event planning with intelligent automation and real-time insights.
            </p>
            <Link to="/login">
              <Button variant="hero" size="lg" className="text-lg px-8 py-4">
                Get Started
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Partners Marquee (moved above the preview image) */}
          <div className="mb-10">
            <div className="relative overflow-hidden border rounded-xl bg-background/80">
              <div className="px-4 py-3 text-sm text-muted-foreground">Trusted by teams at</div>
              <div className="relative">
                <div className="marquee whitespace-nowrap py-4 flex items-center">
                  {[
                    'TechNova',
                    'CloudWorks',
                    'OpenAI Labs',
                    'DataForge',
                    'DevSphere',
                  ].map((name, idx) => (
                    <span key={idx} className="mx-8 text-foreground/80 font-medium">
                      {name}
                    </span>
                  ))}
                  {[
                    'TechNova',
                    'CloudWorks',
                    'OpenAI Labs',
                    'DataForge',
                    'DevSphere',
                  ].map((name, idx) => (
                    <span key={`dup-${idx}`} className="mx-8 text-foreground/80 font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl transform rotate-1"></div>
            <Card className="relative overflow-hidden shadow-2xl border-0">
              <img 
                src="https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1600&auto=format&fit=crop" 
                alt="HELLO WORLD event management hero" 
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-success/90 text-success-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Risk Heatmap
                  </span>
                  <span className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    AI Plan Generator
                  </span>
                  <span className="bg-accent/90 text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Smart Analytics
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Event Calendar Section */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Event Calendar</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => changeMonth(-1)}>&lt;</Button>
              <span className="min-w-[160px] text-center font-medium">{monthLabel}</span>
              <Button variant="outline" onClick={() => changeMonth(1)}>&gt;</Button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-xs md:text-sm font-medium text-muted-foreground mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (
              <div key={w} className="px-2 py-2">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {days.map(({ date, key }) => {
              if (!date) return <div key={key} className="h-24 md:h-28 rounded-lg border bg-background/60" />;
              const ymd = date.toISOString().slice(0,10);
              const dayEvents = eventsByDate[ymd] || [];
              const isToday = new Date().toDateString() === date.toDateString();
              return (
                <button
                  key={key}
                  className={`h-24 md:h-28 rounded-lg border text-left p-2 hover:bg-accent/30 transition ${isToday ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedDate(ymd)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-semibold">{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] md:text-xs bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayEvents.slice(0,2).map((ev, idx) => (
                      <div key={idx} className="truncate text-[10px] md:text-xs text-muted-foreground">• {ev.name}</div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">+{dayEvents.length-2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Events {selectedDate ? `on ${selectedDate}` : 'this month'}</h3>
            {loadingEvents ? (
              <p className="text-muted-foreground">Loading events…</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {(
                  selectedDate ? (eventsByDate[selectedDate] || []) : events
                ).map((ev) => (
                  <Card key={ev.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{ev.name}</h4>
                        <p className="text-muted-foreground text-sm">
                          {ev?.schedule?.startDate?.slice(0,10) || ev?.date || 'TBD'} {ev?.schedule?.startTime ? `• ${ev.schedule.startTime}` : ''}
                        </p>
                      </div>
                      {ev.status && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                          {ev.status}
                        </span>
                      )}
                    </div>
                    {ev.targetAudience && (
                      <p className="text-xs text-muted-foreground mt-2">Audience: {ev.targetAudience}</p>
                    )}
                  </Card>
                ))}
                {(!(selectedDate ? (eventsByDate[selectedDate] || []) : events).length) && (
                  <p className="text-muted-foreground">No events found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Intelligent Event Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Leverage AI to predict bottlenecks, optimize workflows, and ensure your events run flawlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Smart Planning</h3>
              <p className="text-muted-foreground">
                AI analyzes your requirements and generates optimized event plans with intelligent resource allocation.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Risk Prediction</h3>
              <p className="text-muted-foreground">
                Identify potential delays and bottlenecks before they happen with our advanced prediction algorithms.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <Users className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Team Optimization</h3>
              <p className="text-muted-foreground">
                Automatically assign tasks to the best team members based on workload, skills, and availability.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What We Do</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              HELLO WORLD helps organizers plan, execute, and measure events with AI. Here’s how we make your team faster and your events smoother.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Automated Scheduling</h3>
                  <p className="text-muted-foreground mt-1">Turn your event outline into a day-by-day schedule with realistic task durations and dependencies.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <BarChart3 className="h-8 w-8 text-accent" />
                <div>
                  <h3 className="font-semibold text-lg">Predictive Analytics</h3>
                  <p className="text-muted-foreground mt-1">Spot likely risks 2–3 steps ahead. We flag bottlenecks, budget drift, and staffing gaps before they happen.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Users className="h-8 w-8 text-success" />
                <div>
                  <h3 className="font-semibold text-lg">Resource Optimization</h3>
                  <p className="text-muted-foreground mt-1">Assign the right people to the right tasks based on skills, load, and deadlines. No more guesswork.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Execution Dashboard</h3>
                  <p className="text-muted-foreground mt-1">Track progress, blockers, and approvals in one place. Everyone stays aligned in real time.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Target className="h-8 w-8 text-warning" />
                <div>
                  <h3 className="font-semibold text-lg">Budget Control</h3>
                  <p className="text-muted-foreground mt-1">Create allocations, track spend vs. plan, and see where you can save without sacrificing quality.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">One‑Click Plans</h3>
                  <p className="text-muted-foreground mt-1">Generate a starter plan from a prompt like “Tech Fest, 500 attendees, 2 days” and customize instantly.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10 text-sm text-muted-foreground">
            <Card className="p-5">
              <h4 className="font-semibold text-foreground">How it works</h4>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Describe your event goals.</li>
                <li>Generate a smart plan with timelines.</li>
                <li>Assign team and track in real time.</li>
              </ol>
            </Card>
            <Card className="p-5">
              <h4 className="font-semibold text-foreground">Typical results</h4>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Up to 25% faster planning cycles.</li>
                <li>15–30% fewer last‑minute escalations.</li>
                <li>Clearer budgets and accountability.</li>
              </ul>
            </Card>
            <Card className="p-5">
              <h4 className="font-semibold text-foreground">Use cases</h4>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>College fests and cultural events.</li>
                <li>Workshops, hackathons, and summits.</li>
                <li>Community meetups and product launches.</li>
              </ul>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link to="/events">
              <Button size="lg" className="px-8">Plan an event now</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">© 2024 HELLO WORLD — AI for smarter event planning and execution.</p>
            <div className="flex items-center gap-6">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <Instagram className="h-5 w-5" /> <span className="sr-only">Instagram</span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <Twitter className="h-5 w-5" /> <span className="sr-only">Twitter</span>
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> <span className="sr-only">Discord</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Local styles for marquee animation */}
      <style>{`
        .marquee { 
          display: inline-block; 
          min-width: 200%;
          animation: marquee 25s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Landing;