// src/pages/Login.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Button } from "shadcn-ui";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: "demo@example.com",
      password: "demo123",
    });
    if (error) {
      alert(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-md">
        <h1 className="text-center text-3xl font-heading text-ink">
          Your product deserves a trusted shelf.
        </h1>
        <ul className="list-disc space-y-2 pl-5 text-ink">
          <li>Know your true cost</li>
          <li>Prove every batch</li>
          <li>Act quickly</li>
        </ul>
        <Button className="w-full bg-brand hover:bg-brand/90" onClick={handleLogin}>
          Log in (demo)
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
