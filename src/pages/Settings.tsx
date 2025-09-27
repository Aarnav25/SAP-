"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Update workspace and preferences.</p>
        </div>

        {/* Workspace Config */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Basic configuration for your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input id="workspaceName" placeholder="EventAI Team" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" placeholder="Asia/Kolkata" />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Control notifications and theme.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium text-foreground">Email notifications</div>
                <div className="text-sm text-muted-foreground">Get updates for tasks and events.</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium text-foreground">Dark mode</div>
                <div className="text-sm text-muted-foreground">Switch between light and dark theme.</div>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            </div>
            <div className="md:col-span-2">
              <Button>Save changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;