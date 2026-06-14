import { api } from "../lib/api";

export interface GroceryItem {
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
  isPurchased: boolean;
}

export interface GroceryListResponse {
  items: GroceryItem[];
  purchasedCount: number;
  totalCount: number;
  categories: string[];
}

export interface SyncGroceryData {
  duration: number; // 7 for week, 30 for month
  isFamily: boolean;
}

export interface ToggleItemData {
  itemName: string;
  checked: boolean;
}

export interface AddItemData {
  name: string;
  quantity?: string;
  category?: string;
}

export interface ShareResponse {
  success: boolean;
  shareUrl: string;
}

export interface SharedListResponse {
  items: GroceryItem[];
  expiresAt: string;
}

export const groceryService = {
  async getList(params?: { daysAhead?: number }): Promise<GroceryListResponse> {
    const query = params?.daysAhead ? `?daysAhead=${params.daysAhead}` : "";
    return api.get<GroceryListResponse>(`/groceries${query}`);
  },

  async sync(data: SyncGroceryData): Promise<GroceryListResponse> {
    return api.post<GroceryListResponse>("/groceries/sync", data);
  },

  async toggleItem(data: ToggleItemData): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>("/groceries/toggle-item", data);
  },

  async addItem(data: AddItemData): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>("/groceries/add-item", data);
  },

  async share(): Promise<ShareResponse> {
    return api.post<ShareResponse>("/groceries/share");
  },

  async getSharedList(token: string): Promise<SharedListResponse> {
    return api.get<SharedListResponse>(`/groceries/shared/${token}`, {
      skipAuthRefresh: true,
    });
  },

  async exportPdf(): Promise<Blob> {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || "/api"}/export/groceries/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to export PDF");
    }
    return response.blob();
  },
};
