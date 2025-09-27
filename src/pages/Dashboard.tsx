import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Brain } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Array<{ title: string; value: string }>>([]);
  const [recentTasks, setRecentTasks] = useState<Array<{ id: string | number; title: string; assignee?: string; deadline?: string; risk?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<Array<{ id: string | number; name: string; date?: string | null; status?: string; organiser?: { name?: string } }>>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [m, t, e] = await Promise.all([
          fetch("/api/dashboard/metrics").then((r) => r.json()),
          fetch("/api/dashboard/recent-tasks").then((r) => r.json()),
          fetch("/api/events").then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (m?.success) setMetrics(m.data || []);
        if (t?.success) setRecentTasks(t.data || []);
        if (e?.success) setEvents(e.data || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return <Badge variant="destructive" className="text-xs">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-warning text-warning-foreground text-xs">Medium Risk</Badge>;
      case "low":
        return <Badge variant="secondary" className="bg-success-light text-success text-xs">On Track</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your events and optimize with AI insights
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Brain className="mr-2 h-4 w-4" />
              Generate AI Plan
            </Button>
            <Button variant="hero" onClick={() => navigate('/events')}>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.length === 0 && !loading ? (
            <Card className="md:col-span-2 lg:col-span-4">
              <CardContent className="p-6 text-sm text-muted-foreground">No metrics available.</CardContent>
            </Card>
          ) : (
            metrics.map((metric, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Events Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events planned or scheduled next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                (() => {
                  const today = new Date();
                  const upcoming = events.filter(ev => {
                    if (ev.status === 'completed') return false;
                    if (!ev.date) return true; // no date yet → treat as upcoming
                    return new Date(ev.date) >= new Date(today.toDateString());
                  }).slice(0, 6);
                  return upcoming.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No upcoming events.</div>
                  ) : (
                    upcoming.map(ev => (
                      <div key={ev.id} className="p-3 border rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{ev.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {ev.date ? new Date(ev.date).toDateString() : 'TBD'}
                            {ev.organiser?.name ? ` • ${ev.organiser.name}` : ''}
                          </div>
                        </div>
                        <Badge variant="secondary">{ev.status || 'planned'}</Badge>
                      </div>
                    ))
                  );
                })()
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed Events</CardTitle>
              <CardDescription>Recently completed or past events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                (() => {
                  const today = new Date();
                  const completed = events.filter(ev => {
                    if (ev.status === 'completed') return true;
                    if (!ev.date) return false;
                    return new Date(ev.date) < new Date(today.toDateString());
                  }).slice(0, 6);
                  return completed.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No completed events.</div>
                  ) : (
                    completed.map(ev => (
                      <div key={ev.id} className="p-3 border rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{ev.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {ev.date ? new Date(ev.date).toDateString() : 'No date'}
                            {ev.organiser?.name ? ` • ${ev.organiser.name}` : ''}
                          </div>
                        </div>
                        <Badge className="bg-success-light text-success">completed</Badge>
                      </div>
                    ))
                  );
                })()
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Risk Heatmap */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-warning" />
                Risk Heatmap
              </CardTitle>
              <CardDescription>AI-powered risk assessment for your tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : recentTasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No tasks found.</div>
                ) : (
                  recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 ${
                        task.risk === "high"
                          ? "bg-destructive-light border-destructive/20 hover:border-destructive/40"
                          : task.risk === "medium"
                          ? "bg-warning-light border-warning/20 hover:border-warning/40"
                          : "bg-success-light border-success/20 hover:border-success/40"
                      }`}
                    >
                      <h4 className="font-medium text-sm text-foreground mb-2">{task.title}</h4>
                      {task.assignee && (
                        <p className="text-xs text-muted-foreground mb-2">{task.assignee}</p>
                      )}
                      {getRiskBadge(task.risk || "")}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and AI recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Task
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Brain className="mr-2 h-4 w-4" />
                AI Optimization
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;