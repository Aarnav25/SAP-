import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface OverviewItem {
  name: string;
  tasks: number;
  onTime: number;
  pending: number;
}

interface TeamItem {
  name: string;
  completedTasks: number;
  efficiency: number;
}

interface AnalyticsProps {
  overviewData?: OverviewItem[];
  teamData?: TeamItem[];
}

const Analytics: React.FC<AnalyticsProps> = ({
  overviewData = [],
  teamData = [],
}) => {
  // Dynamic data via backend (falls back to props if provided)
  const overviewQuery = useQuery({
    queryKey: ["analytics", "overview-series"],
    queryFn: async () => {
      const r = await fetch("http://localhost:3001/api/analytics/overview-series");
      if (!r.ok) throw new Error(`Overview fetch failed ${r.status}`);
      return r.json() as Promise<{ success: boolean; data: OverviewItem[] }>;
    },
  });
  const teamQuery = useQuery({
    queryKey: ["analytics", "team"],
    queryFn: async () => {
      const r = await fetch("http://localhost:3001/api/analytics/team");
      if (!r.ok) throw new Error(`Team fetch failed ${r.status}`);
      return r.json() as Promise<{ success: boolean; data: TeamItem[] }>;
    },
  });

  // Fetch events to derive status-based analytics (planned, in_progress, completed)
  type EventItem = { id: string | number; status?: string };
  const eventsQuery = useQuery({
    queryKey: ["analytics", "events"],
    queryFn: async () => {
      const r = await fetch("/api/events");
      if (!r.ok) throw new Error(`Events fetch failed ${r.status}`);
      return r.json() as Promise<{ success: boolean; data: EventItem[] }>;
    },
  });

  const ovData = overviewData.length > 0 ? overviewData : (overviewQuery.data?.data ?? []);
  const tmData = teamData.length > 0 ? teamData : (teamQuery.data?.data ?? []);
  const isLoading = overviewQuery.isLoading || teamQuery.isLoading;
  const errorMsg = (overviewQuery.error as Error)?.message || (teamQuery.error as Error)?.message || "";

  // Derive status counts from events
  const events = (eventsQuery.data?.data ?? []) as EventItem[];
  const statusCounts = events.reduce(
    (acc, ev) => {
      const s = (ev.status || "planned") as "planned" | "in_progress" | "completed";
      if (s === "planned") acc.planned += 1;
      else if (s === "in_progress") acc.in_progress += 1;
      else if (s === "completed") acc.completed += 1;
      return acc;
    },
    { planned: 0, in_progress: 0, completed: 0 }
  );
  const statusData = [
    { name: "Planned", value: statusCounts.planned, color: "#a3a3ff" },
    { name: "In Progress", value: statusCounts.in_progress, color: "#ffc107" },
    { name: "Completed", value: statusCounts.completed, color: "#4caf50" },
  ];
  // Safe calculations
  // Compute completion rate: (total completed / total tasks) * 100
  const totals = ovData.reduce(
    (acc, item) => {
      const tasks = Math.max(0, Number(item.tasks || 0));
      const pending = Math.max(0, Number(item.pending || 0));
      const completed = Math.max(0, tasks - pending);
      acc.totalTasks += tasks;
      acc.totalCompleted += completed;
      return acc;
    },
    { totalTasks: 0, totalCompleted: 0 }
  );
  const avgTaskCompletion = totals.totalTasks
    ? Math.round((totals.totalCompleted / totals.totalTasks) * 100)
    : 0;

  const avgOnTime = ovData.length
    ? Math.round(ovData.reduce((sum, item) => sum + item.onTime, 0) / ovData.length)
    : 0;

  // Removed Pending KPI per request

  // removed risk-related calculations

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Insights and performance across events.
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Overview
                </CardTitle>
                <CardDescription>High-level KPIs.</CardDescription>
                {isLoading && (
                  <div className="text-sm text-muted-foreground">Loading analytics…</div>
                )}
                {!!errorMsg && (
                  <div className="text-sm text-red-500">Failed to load data: {errorMsg}</div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                      Avg. Task Completion
                    </div>
                    <div className="text-2xl font-semibold">
                      {avgTaskCompletion}%
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                      On-time Deliveries
                    </div>
                    <div className="text-2xl font-semibold">{avgOnTime}%</div>
                  </div>
                </div>

                {/* Removed bar chart per request */}

                {/* Status Distribution from Events */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground mb-2">Event Status Counts</div>
                    <div className="text-sm">Planned: {statusCounts.planned}</div>
                    <div className="text-sm">In Progress: {statusCounts.in_progress}</div>
                    <div className="text-sm">Completed: {statusCounts.completed}</div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risks tab removed per request */}

          {/* Team */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Workload and efficiency metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="border px-4 py-2 text-left">Name</th>
                        <th className="border px-4 py-2 text-left">Completed Tasks</th>
                        <th className="border px-4 py-2 text-left">Efficiency (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tmData.length > 0 ? (
                        tmData.map((member, idx) => (
                          <tr key={idx}>
                            <td className="border px-4 py-2">{member.name}</td>
                            <td className="border px-4 py-2">{member.completedTasks}</td>
                            <td className="border px-4 py-2">{member.efficiency}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="border px-4 py-2 text-center"
                            colSpan={3}
                          >
                            No team data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;