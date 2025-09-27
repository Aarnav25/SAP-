import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Plus,
  TrendingUp,
  Brain
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Dashboard = () => {
  // Mock data
  const metrics = [
    {
      title: "Event Readiness",
      value: "87%",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success-light"
    },
    {
      title: "Pending Tasks",
      value: "12",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning-light"
    },
    {
      title: "Upcoming Deadlines",
      value: "5",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Team Members",
      value: "24",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10"
    }
  ];

  const recentTasks = [
    { id: 1, title: "Venue Setup", assignee: "John Doe", deadline: "2024-01-15", risk: "low" },
    { id: 2, title: "Catering Arrangements", assignee: "Jane Smith", deadline: "2024-01-14", risk: "high" },
    { id: 3, title: "Sound System Check", assignee: "Mike Johnson", deadline: "2024-01-16", risk: "medium" },
    { id: 4, title: "Registration Setup", assignee: "Sarah Wilson", deadline: "2024-01-13", risk: "low" },
  ];

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
            <Button variant="hero">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${metric.bgColor}`}>
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Risk Heatmap */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-warning" />
                Risk Heatmap
              </CardTitle>
              <CardDescription>
                AI-powered risk assessment for your tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {recentTasks.map((task) => (
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
                    <p className="text-xs text-muted-foreground mb-2">{task.assignee}</p>
                    {getRiskBadge(task.risk)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Task
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Brain className="mr-2 h-4 w-4" />
                AI Optimization
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>
              Latest updates from your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium text-foreground">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">Assigned to {task.assignee}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">{task.deadline}</span>
                    {getRiskBadge(task.risk)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;