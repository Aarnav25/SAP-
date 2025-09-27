import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submit
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-foreground">EventAI</span>
          </div>
          <Badge variant="secondary">Contact</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>
              Questions, feedback, or partnership ideas? Send us a message and we'll get back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" className="min-h-[140px]" />
              </div>
              <Button type="submit" className="h-11">Send Message</Button>
              {submitted && (
                <p className="text-sm text-success">Thanks! We'll be in touch shortly.</p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Other ways to reach us</CardTitle>
            <CardDescription>We'd love to hear from you.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold text-foreground">Email</h4>
              <p className="text-sm text-muted-foreground">support@eventai.app</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold text-foreground">Twitter</h4>
              <p className="text-sm text-muted-foreground">@eventai_app</p>
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

export default Contact;
