import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Member {
  id: number;
  name: string;
  role: string;
  event: string;
  isHead: boolean;
}

const Team = () => {
  const [selectedEvent, setSelectedEvent] = useState("All Events");

  const events = ["All Events", "Tech Symposium", "Cultural Fest", "Sports Meet"];

  const members: Member[] = [
    { id: 1, name: "Aarav Sharma", role: "Organizer", event: "Tech Symposium", isHead: true },
    { id: 2, name: "Priya Nair", role: "Ops Lead", event: "Tech Symposium", isHead: false },
    { id: 3, name: "Rohan Gupta", role: "Logistics", event: "Tech Symposium", isHead: false },
    { id: 4, name: "Ananya Mehta", role: "Head Coordinator", event: "Cultural Fest", isHead: true },
    { id: 5, name: "Kabir Singh", role: "Volunteer", event: "Cultural Fest", isHead: false },
    { id: 6, name: "Sanya Rao", role: "Head", event: "Sports Meet", isHead: true },
    { id: 7, name: "Arjun Verma", role: "Member", event: "Sports Meet", isHead: false },
  ];

  const filteredMembers = selectedEvent === "All Events"
    ? members
    : members.filter((m) => m.event === selectedEvent);

  const totalMembers = members.length;
  const totalHeads = members.filter((m) => m.isHead).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team</h1>
            <p className="text-muted-foreground mt-1">
              Manage members and roles across all events.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-background dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Total Members</CardTitle>
              <CardDescription>All events combined</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground dark:text-white">{totalMembers}</div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Total Heads</CardTitle>
              <CardDescription>Event heads and coordinators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground dark:text-white">{totalHeads}</div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Selected Event</CardTitle>
              <CardDescription>Filter members by event</CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={setSelectedEvent} value={selectedEvent}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event} value={event}>{event}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Members table */}
        <Card className="bg-background dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>List of all members filtered by event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse border border-gray-300 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-200 dark:bg-gray-700 text-left">
                    <th className="p-3 border-b border-gray-300 dark:border-gray-600">Avatar</th>
                    <th className="p-3 border-b border-gray-300 dark:border-gray-600">Name</th>
                    <th className="p-3 border-b border-gray-300 dark:border-gray-600">Role</th>
                    <th className="p-3 border-b border-gray-300 dark:border-gray-600">Event</th>
                    <th className="p-3 border-b border-gray-300 dark:border-gray-600">Head</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="p-3">
                        <Avatar>
                          <AvatarFallback>{m.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                      </td>
                      <td className="p-3 text-foreground dark:text-white">{m.name}</td>
                      <td className="p-3 text-foreground dark:text-white">{m.role}</td>
                      <td className="p-3 text-foreground dark:text-white">{m.event}</td>
                      <td className="p-3 text-foreground dark:text-white">{m.isHead ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Team;