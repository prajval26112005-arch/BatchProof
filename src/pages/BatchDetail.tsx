// src/pages/BatchDetail.tsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "shadcn-ui";
import { QRCodeSVG } from "qrcode.react";

interface Batch {
  id: string;
  batch_no: string;
  production_date: string;
  qty_produced: number;
  status: string;
  label_fields: any;
}

interface Dispatch {
  retailer_name: string;
  qty: number;
  dispatch_date: string;
}

interface IngredientLot {
  supplier_lot_no: string;
  ingredient_name: string;
  qty_used: number;
}

const BatchDetail: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();

  const { data: batch } = useQuery<Batch>(
    ["batch", batchId],
    async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("id, batch_no, production_date, qty_produced, status, label_fields")
        .eq("id", batchId)
        .single();
      if (error) throw error;
      return data as Batch;
    }
  );

  const { data: dispatches } = useQuery<Dispatch[]>(
    ["batchDispatches", batchId],
    async () => {
      const { data, error } = await supabase
        .from("dispatches")
        .select("retailer_id, qty, dispatch_date, retailers(name)")
        .eq("batch_id", batchId);
      if (error) throw error;
      return data.map((row: any) => ({
        retailer_name: row.retailers?.name ?? "",
        qty: row.qty,
        dispatch_date: row.dispatch_date,
      }));
    }
  );

  const { data: ingredients } = useQuery<IngredientLot[]>(
    ["batchIngredients", batchId],
    async () => {
      const { data, error } = await supabase
        .from("batch_ingredients")
        .select("lot_id, qty_used, ingredient_lots(supplier_lot_no, ingredient_id(name))")
        .eq("batch_id", batchId);
      if (error) throw error;
      return data.map((row: any) => ({
        supplier_lot_no: row.ingredient_lots?.supplier_lot_no ?? "",
        ingredient_name: row.ingredient_lots?.ingredient_id?.name ?? "",
        qty_used: row.qty_used,
      }));
    }
  );

  if (!batch) return <div className="p-4">Loading batch...</div>;

  const timeline = [
    { label: "Lot received", date: batch.production_date }, // simplified
    { label: "Batch produced", date: batch.production_date },
    { label: "Label checked", date: batch.production_date }, // placeholder
    { label: "Dispatched", date: dispatches?.[0]?.dispatch_date },
  ].filter((e) => e.date);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading text-ink">Batch {batch.batch_no}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Production date: {batch.production_date}</p>
          <p>Quantity produced: {batch.qty_produced}</p>
          <p>Status: {batch.status}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients Used</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th>Lot No</th>
                <th>Ingredient</th>
                <th>Qty Used</th>
              </tr>
            </thead>
            <tbody>
              {ingredients?.map((il, idx) => (
                <tr key={idx} className="border-b">
                  <td>{il.supplier_lot_no}</td>
                  <td>{il.ingredient_name}</td>
                  <td>{il.qty_used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispatches</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th>Retailer</th>
                <th>Qty</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {dispatches?.map((d, idx) => (
                <tr key={idx} className="border-b">
                  <td>{d.retailer_name}</td>
                  <td>{d.qty}</td>
                  <td>{d.dispatch_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-disc pl-5 space-y-1">
            {timeline.map((ev, i) => (
              <li key={i}>{ev.label}: {ev.date}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Batch Passport</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <QRCodeSVG
            value={JSON.stringify({ batch_no: batch.batch_no, product_id: batch.id })}
            size={180}
            bgColor="#F7F4EE"
            fgColor="#17251F"
          />
        </CardContent>
      </Card>

      <Link to="/" className="text-brand underline">← Back to dashboard</Link>
    </div>
  );
};

export default BatchDetail;
