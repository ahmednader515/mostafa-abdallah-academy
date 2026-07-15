"use client";

import { createContext, useContext, useMemo } from "react";
import { formatMoney, formatMoneyParts } from "@/lib/currency/convert";
import { useLocale } from "./LocaleProvider";

type CurrencyContextValue = {
  formatPrice: (amountEgp: number) => string;
  formatPriceParts: (amountEgp: number) => { amount: string; code: string };
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  const value = useMemo<CurrencyContextValue>(
    () => ({
      formatPrice: (amountEgp: number) => formatMoney(amountEgp, locale),
      formatPriceParts: (amountEgp: number) => formatMoneyParts(amountEgp, locale),
    }),
    [locale],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
