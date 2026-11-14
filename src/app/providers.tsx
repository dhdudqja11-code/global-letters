"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test", currency: "USD" }}>
      {children}
    </PayPalScriptProvider>
  );
}
