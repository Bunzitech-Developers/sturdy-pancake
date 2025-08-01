import { create } from "zustand";

import api from "../utils/api";
import { toast } from "sonner";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  university: string; 
  status: string;
  description: string; 
  lookingFor: string; 
}

interface DashboardState {
  users: User[];
  isLoading: boolean;
  fetchUsers: (gender: string) => Promise<void>;
  requestPhotoAccess: (targetUserId: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({ 
  users: [],
  isLoading: false,
  fetchUsers: async () => { 
    set({ isLoading: true });
    try {
      
      const response = await api.get("/api/users");
      
      
      set({ users: response.data });
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Fetch users error:", error);
    } finally {
      set({ isLoading: false });
    }
  },
  requestPhotoAccess: async (targetUserId: string) => {
    set({ isLoading: true });
    try {
      await api.post("/api/photos/request", { targetUserId });
      toast.success("Photo access request sent!");
      
      
    } catch (error: any) {
      const message = error.message || "Failed to send photo access request";
      toast.error(message);
      console.error("Request photo access error:", error.message);
    } finally {
      set({ isLoading: false });
    }
  },
}));
