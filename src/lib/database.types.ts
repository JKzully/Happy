export type ProductCategory = "hydration" | "creatine" | "energy" | "kids";
export type SubChainType = "netto" | "kjorbud" | "iceland" | "extra" | "krambud";
export type AdPlatform = "meta" | "google";
export type CostCategory = "operations" | "marketing_fixed" | "marketing_variable";

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: ProductCategory;
          production_cost: number;
          sticks_per_box: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: ProductCategory;
          production_cost: number;
          sticks_per_box: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: ProductCategory;
          production_cost?: number;
          sticks_per_box?: number;
          updated_at?: string;
        };
      };
      retail_chains: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
      };
      stores: {
        Row: {
          id: string;
          chain_id: string;
          name: string;
          sub_chain_type: SubChainType | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chain_id: string;
          name: string;
          sub_chain_type?: SubChainType | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chain_id?: string;
          name?: string;
          sub_chain_type?: SubChainType | null;
        };
      };
      chain_prices: {
        Row: {
          id: string;
          chain_id: string;
          product_category: ProductCategory;
          price_per_box: number;
          vsk_multiplier: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chain_id: string;
          product_category: ProductCategory;
          price_per_box: number;
          vsk_multiplier?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chain_id?: string;
          product_category?: ProductCategory;
          price_per_box?: number;
          vsk_multiplier?: number;
          updated_at?: string;
        };
      };
      shopify_prices: {
        Row: {
          id: string;
          product_id: string;
          retail_price: number;
          subscription_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          retail_price: number;
          subscription_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          retail_price?: number;
          subscription_price?: number;
          updated_at?: string;
        };
      };
      daily_sales: {
        Row: {
          id: string;
          date: string;
          store_id: string;
          product_id: string;
          quantity: number;
          order_type: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          store_id: string;
          product_id: string;
          quantity?: number;
          order_type?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          store_id?: string;
          product_id?: string;
          quantity?: number;
          order_type?: string;
          created_by?: string | null;
        };
      };
      daily_ad_spend: {
        Row: {
          id: string;
          date: string;
          platform: AdPlatform;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          platform: AdPlatform;
          amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          platform?: AdPlatform;
          amount?: number;
        };
      };
      historical_daily_sales: {
        Row: {
          id: string;
          date: string;
          chain_slug: string;
          hydration_boxes: number;
          creatine_energy_boxes: number;
          total_boxes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          chain_slug: string;
          hydration_boxes?: number;
          creatine_energy_boxes?: number;
          total_boxes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          chain_slug?: string;
          hydration_boxes?: number;
          creatine_energy_boxes?: number;
          total_boxes?: number;
        };
      };
      fixed_costs: {
        Row: {
          id: string;
          name: string;
          category: CostCategory;
          monthly_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: CostCategory;
          monthly_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: CostCategory;
          monthly_amount?: number;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          location_type: "warehouse" | "store";
          location_name: string;
          chain_slug: string | null;
          quantity_boxes: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          location_type: "warehouse" | "store";
          location_name: string;
          chain_slug?: string | null;
          quantity_boxes: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          location_type?: "warehouse" | "store";
          location_name?: string;
          chain_slug?: string | null;
          quantity_boxes?: number;
          updated_at?: string;
        };
      };
    };
  };
}
