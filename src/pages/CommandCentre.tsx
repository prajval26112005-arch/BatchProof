// src/pages/CommandCentre.tsx
import React from "react";
import { supabase } from "../lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "shadcn-ui";

const CommandCentre: React.FC = () => {
  const { data: lowMarginProducts, isLoading: loadingLowMargin } = useQuery(
    ["lowMarginProducts"],
    async () => {
      const { data, error } = await supabase.rpc("calculate_product_margin");
      if (error) throw error;
      return data;
    },
    { staleTime: 60000 }
  );

  const { data: missingInfoBatches, isLoading: loadingMissing } = useQuery(
    ["missingInfoBatches"],
    async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("id, batch_no, status")
        .in("status", ["Missing information", "Draft"]);
      if (error) throw error;
      return data;
    }
  );

  const { data: openComplaints, isLoading: loadingComplaints } = useQuery(
    ["openComplaints"],
    async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, batch_id, status")
        .eq("status", "Open");
      if (error) throw error;
      return data;
    }
  );

  const { data: activeRecalls, isLoading: loadingRecalls } = useQuery(
    ["activeRecalls"],
    async () => {
      const { data, error } = await supabase
        .from("recalls")
        .select("id, description")
        .neq("id", null);
      if (error) throw error;
      return data;
    }
  );

  if (loadingLowMargin || loadingMissing || loadingComplaints || loadingRecalls) {
    return <div className="p-4">Loading command centre…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading text-ink">Command Centre</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Products Below Margin</CardTitle>
          </CardHeader>
          <CardContent>
            {lowMarginProducts && lowMarginProducts.length > 0 ? (
              <ul className="list-disc pl-5">
                {lowMarginProducts.map((p: any) => (
                  <li key={p.id}>{p.name} – Margin {p.margin_percent.toFixed(1)}%</li>
                ))}
              </ul>
            ) : (
              <p>All products have healthy margins.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Batches Missing Information</CardTitle>
          </CardHeader>
          <CardContent>
            {missingInfoBatches && missingInfoBatches.length > 0 ? (
              <ul className="list-disc pl-5">
                {missingInfoBatches.map((b: any) => (
                  <li key={b.id}>{b.batch_no} – {b.status}</li>
                ))}
              </ul>
            ) : (
              <p>No batches need information.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            {openComplaints && openComplaints.length > 0 ? (
              <ul className="list-disc pl-5">
                {openComplaints.map((c: any) => (
                  <li key={c.id}>Batch {c.batch_id}</li>
                ))}
              </ul>
            ) : (
              <p>No open complaints.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Recalls</CardTitle>
          </CardHeader>
          <CardContent>
            {activeRecalls && activeRecalls.length > 0 ? (
              <ul className="list-disc pl-5">
                {activeRecalls.map((r: any) => (
                  <li key={r.id}>Recall {r.id}</li>
                ))}
              </ul>
            ) : (
              <p>No active recalls.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommandCentre;
