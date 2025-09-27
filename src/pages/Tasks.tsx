import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, AlertTriangle, Clock } from "lucide-react";

const Tasks = () => {
  const [tasks, setTasks] = useState<Array<{ id: string | number; title: string; assignee?: string; status?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/tasks");
        const data = await res.json();
        if (!cancelled && data?.success) setTasks(data.data || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const renderStatus = (status?: string) => {
    switch (status) {
      case "done":
        return <Badge variant="secondary" className="bg-success-light text-success"><CheckCircle className="inline h-3 w-3 mr-1"/> Done</Badge>;
      case "at_risk":
        return <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="inline h-3 w-3 mr-1"/> At Risk</Badge>;
      default:
        return <Badge variant="outline"><Clock className="inline h-3 w-3 mr-1"/> In Progress</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground mt-1">Track and manage all tasks across events.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Recent updates from your team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tasks found.</div>
            ) : (
              tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium text-foreground">{t.title}</div>
                    {t.assignee && (
                      <div className="text-sm text-muted-foreground">Assignee: {t.assignee}</div>
                    )}
                  </div>
                  {renderStatus(t.status)}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
