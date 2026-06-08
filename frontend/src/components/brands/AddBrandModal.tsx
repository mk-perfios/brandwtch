"use client";

import { useState } from "react";
import { brandsApi } from "@/lib/api";
import { ALL_PLATFORMS, platformLabel } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Brand } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (brand: Brand) => void;
}

const DEFAULT_PLATFORMS = [
  "reddit", "twitter", "google", "hacker_news", "news",
  "ai_claude", "ai_chatgpt", "ai_gemini", "ai_perplexity", "ai_content",
];

export default function AddBrandModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(DEFAULT_PLATFORMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Brand name is required");
    setLoading(true);
    setError("");
    try {
      const brand = await brandsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        enabled_platforms: platforms,
      });
      onCreated(brand);
      setName(""); setDescription(""); setWebsiteUrl(""); setKeywords("");
      setPlatforms(DEFAULT_PLATFORMS);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Brand">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Brand Name *"
          placeholder="Acme Corp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />
        <Input
          label="Description"
          placeholder="Brief description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Website URL"
          placeholder="https://example.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
        />
        <Input
          label="Keywords (comma-separated)"
          placeholder="acme, acme corp, acmecorp"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />

        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Platforms to monitor</p>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  platforms.includes(p)
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                    : "bg-transparent border-[#2a2a3e] text-slate-500 hover:border-slate-500"
                }`}
              >
                {platformLabel(p)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Brand</Button>
        </div>
      </form>
    </Modal>
  );
}
