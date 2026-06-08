"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Bell, BellOff, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { alertsApi, brandsApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatRelativeTime } from "@/lib/utils";
import type { Alert, AlertCreate, AlertType, AlertSeverity } from "@/types";

const ALERT_TYPE_OPTIONS: { value: AlertType; label: string }[] = [
  { value: "sentiment_drop", label: "Sentiment Drop" },
  { value: "mention_spike", label: "Mention Spike" },
  { value: "negative_surge", label: "Negative Surge" },
  { value: "keyword_alert", label: "Keyword Alert" },
];

const SEVERITY_OPTIONS: { value: AlertSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const severityBadge: Record<AlertSeverity, "indigo" | "positive" | "neutral" | "negative"> = {
  low: "neutral",
  medium: "indigo",
  high: "negative",
  critical: "negative",
};

function AlertRow({ alert }: { alert: Alert }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["alert-events", alert.id],
    queryFn: () => alertsApi.events(alert.id),
    enabled: expanded,
  });

  const toggle = async () => {
    await alertsApi.update(alert.id, { is_active: !alert.is_active });
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  const del = async () => {
    if (!confirm("Delete this alert?")) return;
    await alertsApi.delete(alert.id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className={`w-2 h-2 rounded-full shrink-0 ${alert.is_active ? "bg-green-500" : "bg-slate-600"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-200 text-sm">{alert.name}</span>
            <Badge variant={severityBadge[alert.severity]}>{alert.severity}</Badge>
            <Badge variant="outline">{alert.alert_type.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Window: {alert.threshold_window_hours}h
            {alert.threshold_value != null && ` · Threshold: ${alert.threshold_value}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={toggle}>
            {alert.is_active ? <BellOff size={14} /> : <Bell size={14} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={del}>
            <Trash2 size={14} className="text-red-400" />
          </Button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#2a2a3e] px-5 py-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Recent Events</p>
          {events.length === 0 ? (
            <p className="text-xs text-slate-600">No events fired yet.</p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 5).map((ev) => (
                <div key={ev.id} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${ev.resolved ? "bg-slate-500" : "bg-red-400"}`} />
                  <p className="text-xs text-slate-400 flex-1">{ev.message}</p>
                  <span className="text-xs text-slate-600 shrink-0">{formatRelativeTime(ev.triggered_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<AlertCreate>>({
    severity: "medium",
    alert_type: "sentiment_drop",
    threshold_window_hours: 24,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => alertsApi.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: brandsApi.list,
  });

  const set = (k: keyof AlertCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand_id || !form.name) return setError("Brand and name are required");
    setLoading(true);
    setError("");
    try {
      await alertsApi.create(form as AlertCreate);
      qc.invalidateQueries({ queryKey: ["alerts"] });
      setShowAdd(false);
      setForm({ severity: "medium", alert_type: "sentiment_drop", threshold_window_hours: 24 });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">{alerts.length} configured alerts</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Alert
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20 text-slate-600">No alerts configured yet.</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => <AlertRow key={a.id} alert={a} />)}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Alert">
        <form onSubmit={submit} className="space-y-4">
          <Select
            label="Brand *"
            options={[{ value: "", label: "Select brand…" }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
            value={form.brand_id || ""}
            onChange={set("brand_id")}
          />
          <Input
            label="Alert Name *"
            placeholder="High negative sentiment"
            value={form.name || ""}
            onChange={set("name")}
            error={error}
          />
          <Select
            label="Alert Type"
            options={ALERT_TYPE_OPTIONS}
            value={form.alert_type}
            onChange={set("alert_type")}
          />
          <Select
            label="Severity"
            options={SEVERITY_OPTIONS}
            value={form.severity}
            onChange={set("severity")}
          />
          <Input
            label="Threshold Value"
            type="number"
            step="any"
            placeholder="e.g. -0.3 for sentiment, 100 for spike"
            value={form.threshold_value ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, threshold_value: parseFloat(e.target.value) || undefined }))}
          />
          <Input
            label="Window (hours)"
            type="number"
            min="1"
            value={form.threshold_window_hours || 24}
            onChange={(e) => setForm((f) => ({ ...f, threshold_window_hours: parseInt(e.target.value) }))}
          />
          <Input
            label="Notify Email"
            type="email"
            placeholder="alerts@example.com"
            value={form.notify_email || ""}
            onChange={set("notify_email")}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Alert</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
