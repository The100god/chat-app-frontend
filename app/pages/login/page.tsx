"use client";
import { Suspense } from "react";
import AuthForm from "../../components/AuthForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm type="login" />;
    </Suspense>
  );
}
