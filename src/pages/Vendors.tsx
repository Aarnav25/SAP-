import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Vendor = {
  id: number;
  name: string;
  contactPerson?: string;
  serviceType?: string;
  phone?: string;
  email?: string;
  status?: "pending" | "confirmed" | "in_progress" | "completed";
  createdAt?: string;
};

const emptyForm: Omit<Vendor, "id"> = {
  name: "",
  contactPerson: "",
  serviceType: "",
  phone: "",
  email: "",
  status: "pending",
};

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Vendor, "id">>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/vendors");
      const data = await res.json();
      if (data?.success) setVendors(data.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setSubmitting(true);
      const isEdit = editingId != null;
      const url = isEdit ? `/api/vendors/${editingId}` : "/api/vendors";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || "Request failed");
      await load();
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (e: any) {
      setError(e?.message || "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  }

  async function startEdit(v: Vendor) {
    setEditingId(v.id);
    setForm({
      name: v.name || "",
      contactPerson: v.contactPerson || "",
      serviceType: v.serviceType || "",
      phone: v.phone || "",
      email: v.email || "",
      status: (v.status as any) || "pending",
    });
    setShowForm(true);
  }

  async function remove(id: number) {
    if (!confirm("Delete this vendor?")) return;
    try {
      await fetch(`/api/vendors/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      // noop
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendors</h1>
            <p className="text-muted-foreground mt-1">Manage vendor contacts and engagement status.</p>
          </div>
          <Button onClick={() => { setShowForm(s => !s); if (!showForm) { setForm(emptyForm); setEditingId(null); } }}>
            {showForm ? "Close" : "Add Vendor"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit Vendor" : "Create Vendor"}</CardTitle>
              <CardDescription>Store vendor details for quick coordination.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={createOrUpdate}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Vendor Name</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Input id="serviceType" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} placeholder="AV, Catering, Venue..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Button type="submit" disabled={submitting}>{submitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save" : "Create")}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Vendor Directory</CardTitle>
            <CardDescription>{loading ? "Loading..." : `${vendors.length} vendors`}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4">Service</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="py-2 pr-4 text-foreground font-medium">{v.name}</td>
                      <td className="py-2 pr-4">{v.contactPerson || "—"}</td>
                      <td className="py-2 pr-4">{v.serviceType || "—"}</td>
                      <td className="py-2 pr-4">{v.phone || "—"}</td>
                      <td className="py-2 pr-4">{v.email || "—"}</td>
                      <td className="py-2 pr-4">{v.status || "pending"}</td>
                      <td className="py-2 pr-4 space-x-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(v)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(v.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                  {!vendors.length && !loading && (
                    <tr>
                      <td className="py-4 text-muted-foreground" colSpan={7}>No vendors yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </DashboardLayout>
  );
};

export default Vendors;
