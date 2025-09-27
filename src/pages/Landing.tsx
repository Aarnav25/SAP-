import { Link } from "react-router-dom";
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
  Zap
} from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">EventAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Sign Up</Button>
            </Link>
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
            <Link to="/dashboard">
              <Button variant="hero" size="lg" className="text-lg px-8 py-4">
                Get Started
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl transform rotate-1"></div>
            <Card className="relative overflow-hidden shadow-2xl border-0">
              <img 
                src={heroImage} 
                alt="AI-powered event management dashboard" 
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

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center space-x-8 mb-4">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <span className="text-muted-foreground">
              Built for Hackathon 2024
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 EventAI. Empowering organizers with intelligent automation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;