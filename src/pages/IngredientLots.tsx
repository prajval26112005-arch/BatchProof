// src/pages/IngredientLots.tsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "shadcn-ui";
import { Input } from "shadcn-ui";
import { Button } from "shadcn-ui";

interface Lot {
  id: string;
  supplier_lot_no: string;
  qty: number;
  unit_price: number;
  received_date: string;
  expiry: string | null;
  ingredient_name: string;
  supplier_name: string;
}

const IngredientLots: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: lots, isLoading } = useQuery<Lot[]>(
    ["ingredientLots"],
    async () => {
      const { data, error } = await supabase
        .from("ingredient_lots")
        .select(
          "id, supplier_lot_no, qty, unit_price, received_date, expiry, ingredient_id (name), supplier_id (name)"
        );
      if (error) throw error;
      // reshape
      return data.map((row: any) => ({
        id: row.id,
        supplier_lot_no: row.supplier_lot_no,
        qty: row.qty,
        unit_price: row.unit_price,
        received_date: row.received_date,
        expiry: row.expiry,
        ingredient_name: row.ingredient_id?.name,
        supplier_name: row.supplier_id?.name,
      }));
    }
  );

  const [form, setForm] = useState({
    supplierLotNo: "",
    qty: "",
    unitPrice: "",
    receivedDate: "",
    expiry: "",
    ingredientId: "",
    supplierId: "",
  });

  const handleAdd = async () => {
    const { error } = await supabase.from("ingredient_lots").insert({
      supplier_lot_no: form.supplierLotNo,
      qty: Number(form.qty),
      unit_price: Number(form.unitPrice),
      received_date: form.receivedDate,
      expiry: form.expiry || null,
      ingredient_id: form.ingredientId,
      supplier_id: form.supplierId,
    });
    if (error) {
      alert(error.message);
    } else {
      queryClient.invalidateQueries(["ingredientLots"]);
      setForm({
        supplierLotNo: "",
        qty: "",
        unitPrice: "",
        receivedDate: "",
        expiry: "",
        ingredientId: "",
        supplierId: "",
      });
    }
  };

  if (isLoading) return <div className="p-4">Loading ingredient lots…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading text-ink">Ingredient Lots</h1>
      <Card>
        <CardHeader>
          <CardTitle>Current Lots</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th>Lot No</th>
                <th>Ingredient</th>
                <th>Supplier</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Received</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {lots?.map((lot) => (
                <tr key={lot.id} className="border-b">
                  <td>{lot.supplier_lot_no}</td>
                  <td>{lot.ingredient_name}</td>
                  <td>{lot.supplier_name}</td>
                  <td>{lot.qty}</td>
                  <td>{lot.unit_price}</td>
                  <td>{lot.received_date}</td>
                  <td>{lot.expiry ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Lot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Lot No (e.g., MNG-2026-041)"
            value={form.supplierLotNo}
            onChange={(e) => setForm({ ...form, supplierLotNo: e.target.value })}
          />
          <Input
            placeholder="Ingredient ID"
            value={form.ingredientId}
            onChange={(e) => setForm({ ...form, ingredientId: e.target.value })}
          />
          <Input
            placeholder="Supplier ID"
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
          />
          <Input
            placeholder="Quantity"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
          />
          <Input
            placeholder="Unit Price"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
          />
          <Input
            placeholder="Received Date (YYYY-MM-DD)"
            value={form.receivedDate}
            onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
          />
          <Input
            placeholder="Expiry Date (optional)"
            value={form.expiry}
            onChange={(e) => setForm({ ...form, expiry: e.target.value })}
          />
          <Button className="bg-brand hover:bg-brand/90" onClick={handleAdd}>
            Add Lot
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngredientLots;
