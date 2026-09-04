import { create } from "zustand";
import { api } from "../lib/api";

type StaffRole = "STAFF" | "ADMIN";

type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  bankerEmail: string;
  role: StaffRole;
  branch: {
    id: string;
    branchId: string;
    country: string;
    city: string;
    name: string;
    address: string;
  };
};

type StaffAuthState = {
  staff: Staff | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;

  setStaff: (staff: Staff | null) => void;
  setCheckingAuth: (isCheckingAuth: boolean) => void;

  checkAuth: () => Promise<void>;
  clearAuth: () => void;
};

export const useStaffAuthStore = create<StaffAuthState>((set) => ({
  staff: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  setStaff: (staff) =>
    set({
      staff,
      isAuthenticated: !!staff,
      isCheckingAuth: false,
    }),

  setCheckingAuth: (isCheckingAuth) => set({ isCheckingAuth }),

  clearAuth: () =>
    set({
      staff: null,
      isAuthenticated: false,
      isCheckingAuth: false,
    }),

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const response = await api.get("/staff/auth/me");

      console.log(response);
      const staffData = response.data.data;

      set({
        staff: staffData,
        isAuthenticated: !!staffData,
        isCheckingAuth: false,
      });
    } catch {
      set({
        staff: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });
    }
  },
}));
