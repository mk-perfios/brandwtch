"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { brandsApi } from "@/lib/api";
import BrandCard from "@/components/brands/BrandCard";
import AddBrandModal from "@/components/brands/AddBrandModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Brand } from "@/types";

export default function BrandsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: brandsApi.list,
  });

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const onCreated = (brand: Brand) => {
    qc.setQueryData<Brand[]>(["brands"], (prev) => [...(prev ?? []), brand]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Brands</h1>
          <p className="text-sm text-slate-500 mt-0.5">{brands.length} brands being monitored</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Brand
        </Button>
      </div>

      <div className="max-w-xs">
        <Input
          placeholder="Search brands…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          {search ? "No brands match your search." : "No brands yet. Add your first brand."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}

      <AddBrandModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={onCreated}
      />
    </div>
  );
}
