import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import CommandCentre from "./pages/CommandCentre";
import IngredientLots from "./pages/IngredientLots";
import Products from "./pages/Products";
import CreateBatchWizard from "./pages/CreateBatchWizard";
import BatchDetail from "./pages/BatchDetail";
import { supabase } from "./lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

const App: React.FC = () => {
  const { data: user, isLoading } = useQuery(
    ["auth"],
    async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    { staleTime: Infinity }
  );

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard"
        element={user ? <CommandCentre /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/ingredient-lots"
        element={user ? <IngredientLots /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/products"
        element={user ? <Products /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/create-batch"
        element={user ? <CreateBatchWizard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/batch/:batchId"
        element={user ? <BatchDetail /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default App;
