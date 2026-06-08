"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { authApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    org_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.org_name.trim()) return setError("Organization name is required");
    setLoading(true);
    setError("");
    try {
      const data = await authApi.register(form);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("org_id", data.org.id);
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-100">BrandWtch</span>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-7">
          <h1 className="text-lg font-semibold text-slate-100 mb-1">Create account</h1>
          <p className="text-sm text-slate-500 mb-6">Start monitoring your brand across every platform</p>

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Jane Smith"
              value={form.full_name}
              onChange={set("full_name")}
            />
            <Input
              label="Email *"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
              required
            />
            <Input
              label="Password *"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              required
            />
            <Input
              label="Organization Name *"
              placeholder="Acme Corp"
              value={form.org_name}
              onChange={set("org_name")}
              required
              error={error}
            />
            <Button type="submit" className="w-full justify-center" loading={loading}>
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
