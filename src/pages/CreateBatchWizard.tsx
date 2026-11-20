// src/pages/CreateBatchWizard.tsx
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "shadcn-ui";
import { Button } from "shadcn-ui";
import { Input } from "shadcn-ui";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "shadcn-ui";
import { toast } from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  selling_price: number;
}

interface Lot {
  id: string;
  supplier_lot_no: string;
  ingredient_name: string;
  qty: number;
}

const steps = [
  "Select product",
  "Pick ingredient lots",
  "Enter batch quantity",
  "Production details",
  "Cost review",
  "Label check",
  "Publish",
] as const;

type Step = typeof steps[number];

const CreateBatchWizard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(0);

  // ----- Step 1: product -----
  const { data: products } = useQuery<Product[]>(["productsList"], async () => {
    const { data, error } = await supabase.from("products").select("id, name, selling_price");
    if (error) throw error;
    return data as Product[];
  });
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // ----- Step 2: ingredient lots -----
  const { data: lots } = useQuery<Lot[]>(["availableLots"], async () => {
    const { data, error } = await supabase
      .from("ingredient_lots")
      .select("id, supplier_lot_no, qty, ingredient_id (name)")
      .order("supplier_lot_no");
    if (error) throw error;
    return data.map((row: any) => ({
      id: row.id,
      supplier_lot_no: row.supplier_lot_no,
      ingredient_name: row.ingredient_id?.name ?? "",
      qty: row.qty,
    }));
  });
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const toggleLot = (id: string) => {
    setSelectedLotIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ----- Step 3: batch quantity -----
  const [batchQty, setBatchQty] = useState(0);

  // ----- Step 4: production details -----
  const [productionDate, setProductionDate] = useState("");

  // ----- Step 5: cost review (computed) -----
  const [costs, setCosts] = useState({
    ingredients: 0,
    packaging: 0,
    labour: 0,
    utilities: 0,
    transport: 0,
    wastage: 0,
  });

  // ----- Step 6: label check -----
  const [labelReady, setLabelReady] = useState(false);

  // ----- Helper functions -----
  const next = async () => {
    // validation per step
    if (current === 0 && !selectedProduct) {
      toast.error("Select a product");
      return;
    }
    if (current === 1 && selectedLotIds.length === 0) {
      toast.error("Pick at least one ingredient lot");
      return;
    }
    if (current === 2 && batchQty <= 0) {
      toast.error("Enter a positive batch quantity");
      return;
    }
    if (current === 3 && !productionDate) {
      toast.error("Enter production date");
      return;
    }
    if (current === 4) {
      // compute ingredient cost from selected lots (simple sum of unit_price * qty_used)
      const { data, error } = await supabase
        .from("ingredient_lots")
        .select("unit_price, qty")
        .in("id", selectedLotIds);
      if (error) { toast.error(error.message); return; }
      const ingredientCost = data.reduce((sum: number, row: any) => sum + row.unit_price * row.qty, 0);
      // other costs are static for demo – could be editable later
      setCosts({
        ingredients: ingredientCost,
        packaging: 1000,
        labour: 1200,
        utilities: 400,
        transport: 300,
        wastage: 200,
      });
    }
    if (current === 5 && !labelReady) {
      toast.error("Complete label checklist before publishing");
      return;
    }
    if (current === steps.length - 1) {
      // final publish – create batch + link lots
      const batchId = crypto.randomUUID();
      const { error: batchErr } = await supabase.from("batches").insert({
        id: batchId,
        product_id: selectedProduct,
        batch_no: `BP-${Date.now()}`,
        production_date: productionDate,
        qty_produced: batchQty,
        status: "Ready for review",
        label_fields: {},
        cost_ingredients: costs.ingredients,
        cost_packaging: costs.packaging,
        cost_labour: costs.labour,
        cost_utilities: costs.utilities,
        cost_transport: costs.transport,
        cost_wastage: costs.wastage,
      });
      if (batchErr) { toast.error(batchErr.message); return; }
      // link lots
      const inserts = selectedLotIds.map((lotId) => ({
        batch_id: batchId,
        lot_id: lotId,
        qty_used: 0, // placeholder – real UI would ask per‑lot qty
      }));
      const { error: linkErr } = await supabase.from("batch_ingredients").insert(inserts);
      if (linkErr) { toast.error(linkErr.message); }
      toast.success("Batch created!");
      queryClient.invalidateQueries(["batches"]);
      navigate(`/batch/${batchId}`);
      return;
    }
    setCurrent((c) => c + 1);
  };

  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  // ----- Render per step -----
  const renderStep = () => {
    switch (current) {
      case 0:
        return (
          <Select onValueChange={setSelectedProduct} value={selectedProduct}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} (₹{p.selling_price})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 1:
        return (
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {lots?.map((lot) => (
              <label key={lot.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedLotIds.includes(lot.id)}
                  onChange={() => toggleLot(lot.id)}
                />
                <span>{lot.supplier_lot_no} – {lot.ingredient_name} (qty {lot.qty})</span>
              </label>
            ))}
          </div>
        );
      case 2:
        return (
          <Input
            type="number"
            placeholder="Batch produced quantity (e.g., jars)"
            value={batchQty || ""}
            onChange={(e) => setBatchQty(Number(e.target.value))}
          />
        );
      case 3:
        return (
          <Input
            type="date"
            value={productionDate}
            onChange={(e) => setProductionDate(e.target.value)}
          />
        );
      case 4:
        return (
          <div className="space-y-2">
            <p>Ingredient cost (calc): ₹{costs.ingredients.toFixed(2)}</p>
            <p>Packaging: ₹{costs.packaging}</p>
            <p>Labour: ₹{costs.labour}</p>
            <p>Utilities: ₹{costs.utilities}</p>
            <p>Transport: ₹{costs.transport}</p>
            <p>Wastage: ₹{costs.wastage}</p>
            <p className="font-bold">Total: ₹{(
              costs.ingredients +
              costs.packaging +
              costs.labour +
              costs.utilities +
              costs.transport +
              costs.wastage
            ).toFixed(2)}</p>
          </div>
        );
      case 5:
        // Minimal label checklist – for demo we just toggle ready
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Information readiness check. Final responsibility remains with the producer and relevant authority.</p>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={labelReady}
                onChange={(e) => setLabelReady(e.target.checked)}
              />
              <span>All required label fields completed</span>
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading text-ink">Create Batch Wizard</h1>
      <Card>
        <CardHeader>
          <CardTitle>{steps[current]}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>
      <div className="flex justify-between">
        <Button onClick={prev} disabled={current === 0}>Back</Button>
        <Button onClick={next} className="bg-brand hover:bg-brand/90">
          {current === steps.length - 1 ? "Publish" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default CreateBatchWizard;
