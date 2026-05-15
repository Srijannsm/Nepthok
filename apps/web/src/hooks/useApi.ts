"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { get, post } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { Subscription, Tenant, User } from "../types";

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      post<{ accessToken: string; user: User }>("/auth/login", credentials),
    onSuccess: (data) => {
      login(data.accessToken, data.user);
    },
  });

  return { user, isAuthenticated, login: loginMutation, logout };
}

export function useTenant() {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery<Tenant>({
    queryKey: ["tenant", "my"],
    queryFn: () => get<Tenant>("/tenants/my"),
    enabled: isAuthenticated && !!user?.tenantId,
  });
}

export function useSubscription() {
  const { isAuthenticated, user } = useAuthStore();

  const query = useQuery<Subscription>({
    queryKey: ["subscription", "my"],
    queryFn: () => get<Subscription>("/subscriptions/my"),
    enabled: isAuthenticated && !!user?.tenantId,
  });

  const checkAccess = async (feature: string): Promise<boolean> => {
    try {
      return await get<boolean>(`/subscriptions/check-access?feature=${feature}`);
    } catch {
      return false;
    }
  };

  return { ...query, checkAccess };
}
