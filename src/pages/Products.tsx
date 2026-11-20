// src/pages/Products.tsx
import React from "react";
import { supabase } from "../lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "shadcn-ui";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  total_cost: number | null;
  margin_percent: number | null;
}

const Products: React.FC = () => {
  const { data: products, isLoading } = useQuery<Product[]>(
    ["products"],
    async () => {
      const { data, error } = await supabase.rpc("calculate_product_margin");
      if (error) throw error;
      return data as Product[];
    }
  );

  if (isLoading) return <div className="p-4">Loading products…</div>;

  const chartData = products?.map((p) => ({ name: p.name, margin: p.margin_percent ?? 0 }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading text-ink">Products & True Cost</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products?.map((p) => (
          <Card key={p.id} className="bg-white">
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Selling price: ₹{p.selling_price}</p>
              <p>Total cost: ₹{p.total_cost?.toFixed(2) ?? "-"}</p>
              <p>Margin: {p.margin_percent?.toFixed(1) ?? "-"}%</p>
              {p.margin_percent !== null && p.margin_percent < 0 && (
                <p className="text-red-600 font-semibold">Loss warning!</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Margin Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="margin" fill="#1E6B52" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
