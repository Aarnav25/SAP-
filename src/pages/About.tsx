import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-foreground">EventAI</span>
          </div>
          <Badge variant="secondary">About</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
            <CardDescription>
              Empower event organizers with AI-driven planning, prediction, and optimization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              EventAI helps teams plan smarter by surfacing risks early, suggesting optimal task assignments,
              and providing real-time insights into progress and bottlenecks. Our goal is to reduce stress
              and increase the success rate of complex events through intelligent automation.
            </p>
            <p>
              From college fests to enterprise conferences, EventAI scales with your needs and grows smarter
              with every event.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              The Team
            </CardTitle>
            <CardDescription>Organizers and engineers passionate about great events.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold text-foreground">Product & UX</h4>
              <p className="text-sm text-muted-foreground">
                Focused on seamless workflows, accessibility, and delightful interactions.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold text-foreground">Engineering</h4>
              <p className="text-sm text-muted-foreground">
                Building fast, reliable systems with modern web tooling and AI.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2024 EventAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default About;
