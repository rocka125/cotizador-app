import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PriceItem {
  sheet: string;
  sku: string;
  desc: string;
  price: number;
}

export function usePriceList() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("price_list")
      .select("sheet, sku, desc, price")
      .order("sheet")
      .then(({ data, error }) => {
        if (!error && data) setPrices(data as PriceItem[]);
        setLoading(false);
      });
  }, []);

  return { prices, loading };
}