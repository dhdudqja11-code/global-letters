import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { orderID } = await req.json();

    if (!orderID) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId === "여기에_PAYPAL_CLIENT_ID를_붙여넣으세요") {
      console.warn("PayPal API Keys are missing. Returning mock verification success for development.");
      return NextResponse.json({ success: true, verified: true });
    }

    // PayPal API base URL configuration based on mode
    const mode = process.env.PAYPAL_MODE || "sandbox";
    const baseUrl = mode === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";

    console.log(`[PayPal Verification] Verifying order ${orderID} in ${mode} mode...`);

    // 1. Get Access Token from PayPal
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!tokenResponse.ok) {
      const tokenErr = await tokenResponse.text();
      console.error(`[PayPal Token Failure] HTTP ${tokenResponse.status}:`, tokenErr);
      return NextResponse.json({ error: "Failed to authenticate with PayPal" }, { status: 502 });
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error("Failed to parse access token from PayPal");
    }

    // 2. Verify the Order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!orderResponse.ok) {
      const orderErr = await orderResponse.text();
      console.error(`[PayPal Order Check Failure] HTTP ${orderResponse.status}:`, orderErr);
      return NextResponse.json({ error: "Failed to fetch order details from PayPal" }, { status: 502 });
    }

    const orderData = await orderResponse.json();

    // Check if the order is completed and paid
    if (orderData.status === "COMPLETED") {
      console.log(`[PayPal Verification Success] Order ${orderID} verified successfully.`);
      return NextResponse.json({ success: true, verified: true });
    } else {
      console.warn(`[PayPal Verification Warning] Order ${orderID} status is not completed: ${orderData.status}`);
      return NextResponse.json({ success: false, verified: false, error: `Payment status is ${orderData.status}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("PayPal verification error:", error);
    return NextResponse.json({ error: "Failed to verify payment." }, { status: 500 });
  }
}
