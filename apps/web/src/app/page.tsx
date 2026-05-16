"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";

export default function Home() {
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/shop");
      return;
    }
    if (user?.role === "SUPER_ADMIN") {
      router.replace("/superadmin");
    } else {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, user, router]);

  return null;
}
