import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { toast } from "sonner";

interface AuthProps {
  mode: "login" | "signup";
}

const Auth = ({ mode }: AuthProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const validateEmail = (value: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value);

  const sendOtp = async () => {
    setError("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (mode === "signup" && !role) {
      setError("Please select a role");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, context: mode, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to send OTP");
      }
      setOtp("");
      setStep("otp");
      toast.success("OTP sent", { description: `We sent a 6-digit code to ${email}` });
      // Start resend cooldown (e.g., 30s)
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(interval);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e: any) {
      setError(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Verification failed");
      }
      toast.success("Welcome", { description: mode === "login" ? "Logged in successfully" : "Account verified" });
      navigate("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    await sendOtp();
  };

  const handleDemoLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {mode === "login" 
              ? "Sign in to your EventAI account" 
              : "Join EventAI to start organizing smarter"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11"
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organizer">Event Organizer</SelectItem>
                      <SelectItem value="committee">Committee Lead</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {error && (
                <div className="text-destructive text-sm text-center bg-destructive-light p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button onClick={sendOtp} disabled={loading} className="w-full h-11">
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enter the 6-digit code sent to {email}</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp} className="w-full">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSeparator />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <div className="text-destructive text-sm text-center bg-destructive-light p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="flex-1 h-11">
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <Button variant="outline" onClick={() => setStep("email")} className="h-11">
                  Edit Email
                </Button>
              </div>
              <Button variant="ghost" onClick={resendOtp} disabled={resendCooldown > 0} className="w-full h-10">
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </Button>
              <div className="text-xs text-muted-foreground text-center">Tip: For demo you can also enter 123456</div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button 
              variant="outline" 
              className="w-full h-11"
              onClick={handleDemoLogin}
            >
              Demo Login (Skip Auth)
            </Button>

            <div className="text-center text-sm">
              {mode === "login" ? (
                <span className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;