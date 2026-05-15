"use client";

import { create } from "zustand";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token, user) => {
    localStorage.setItem("nepthok_token", token);
    localStorage.setItem("nepthok_user", JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("nepthok_token");
    localStorage.removeItem("nepthok_user");
    set({ token: null, user: null, isAuthenticated: false });
    window.location.href = "/login";
  },

  initAuth: () => {
    const token = localStorage.getItem("nepthok_token");
    const userRaw = localStorage.getItem("nepthok_user");
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as User;
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem("nepthok_token");
        localStorage.removeItem("nepthok_user");
      }
    }
  },
}));
