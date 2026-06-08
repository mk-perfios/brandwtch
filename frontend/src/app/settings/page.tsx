"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, Shield } from "lucide-react";
import { orgsApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatRelativeTime } from "@/lib/utils";
import type { OrgMember } from "@/types";

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

const roleBadge: Record<string, "indigo" | "positive" | "outline"> = {
  owner: "positive",
  admin: "indigo",
  member: "outline",
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const orgId = typeof window !== "undefined" ? localStorage.getItem("org_id") ?? "" : "";

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => orgsApi.members(orgId),
    enabled: !!orgId,
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError("");
    try {
      await orgsApi.invite(orgId, inviteEmail, inviteRole);
      qc.invalidateQueries({ queryKey: ["members", orgId] });
      setShowInvite(false);
      setInviteEmail("");
    } catch (err: any) {
      setInviteError(err?.response?.data?.detail || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member from the organization?")) return;
    await orgsApi.removeMember(orgId, userId);
    qc.invalidateQueries({ queryKey: ["members", orgId] });
  };

  const envVars = [
    { key: "REDDIT_CLIENT_ID", description: "Reddit API Client ID (PRAW)" },
    { key: "TWITTER_BEARER_TOKEN", description: "Twitter API v2 Bearer Token" },
    { key: "SERPAPI_KEY", description: "SerpAPI key (Google + AI content scan)" },
    { key: "NEWS_API_KEY", description: "NewsAPI key" },
    { key: "YOUTUBE_API_KEY", description: "YouTube Data API v3 key" },
    { key: "OPENAI_API_KEY", description: "OpenAI API key (ChatGPT probing)" },
    { key: "ANTHROPIC_API_KEY", description: "Anthropic API key (Claude probing)" },
    { key: "GOOGLE_AI_API_KEY", description: "Google AI API key (Gemini probing)" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Organization settings and members</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Invite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a3e]">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-300">
                    {(m.user?.full_name || m.user?.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium">
                      {m.user?.full_name || m.user?.email || m.user_id}
                    </p>
                    {m.user?.full_name && (
                      <p className="text-xs text-slate-500">{m.user.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleBadge[m.role] || "outline"}>
                      {m.role === "owner" && <Shield size={10} className="mr-1" />}
                      {m.role}
                    </Badge>
                    <span className="text-xs text-slate-600">{formatRelativeTime(m.joined_at)}</span>
                    {m.role !== "owner" && (
                      <Button variant="ghost" size="sm" onClick={() => removeMember(m.user_id)}>
                        <Trash2 size={13} className="text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-4">
            Configure these in your <code className="text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded">.env</code> file.
            Crawlers silently skip platforms whose keys are not set.
          </p>
          <div className="space-y-2">
            {envVars.map(({ key, description }) => (
              <div key={key} className="flex items-center gap-3 py-2 border-b border-[#2a2a3e] last:border-0">
                <code className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded font-mono w-52 shrink-0">
                  {key}
                </code>
                <span className="text-xs text-slate-500">{description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            error={inviteError}
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button type="submit" loading={inviting}>Send Invite</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
