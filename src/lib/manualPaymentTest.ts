/**
 * Browser Console Test Script
 *
 * Copy & paste này vào browser DevTools console để test OTP payment flow:
 *
 * (async () => {
 *   const { runPaymentTestFlow } = await import('http://localhost:3000/_next/static/chunks/payment-test.js');
 *   await runPaymentTestFlow(100);
 * })();
 *
 * HOẶC sử dụng script này như một reference khi viết test
 */

export async function manualPaymentTest() {
  console.clear();
  console.log("🚀 Manual Payment Test Started\n");

  const baseURL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181/api";

  try {
    // Step 1: Create payment
    console.log("📍 Step 1: Creating payment...");
    const createResponse = await fetch(`${baseURL}/payments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
      body: JSON.stringify({ amount: 100 }),
    });

    if (!createResponse.ok) {
      throw new Error(`Create payment failed: ${createResponse.status}`);
    }

    const orderData = await createResponse.json();
    const transferAmountVnd =
      orderData.transferAmountVnd ?? orderData.amount * 1000;
    console.log("✅ Payment created:", orderData);
    console.log(`  OrderID: ${orderData.orderId}`);
    console.log(
      `  Amount: ${orderData.amount} hoa (~${transferAmountVnd.toLocaleString("vi-VN")}đ)\n`,
    );

    // Step 2: Get test signature
    console.log("📍 Step 2: Getting test signature...");
    const signatureResponse = await fetch(
      `${baseURL}/payments/test-signature?order_id=${orderData.orderId}&amount=${transferAmountVnd}&status=SUCCESS`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      },
    );

    if (!signatureResponse.ok) {
      throw new Error(`Get signature failed: ${signatureResponse.status}`);
    }

    const signatureData = await signatureResponse.json();
    console.log(
      "✅ Signature obtained:",
      signatureData.signature.substring(0, 20) + "...\n",
    );

    // Step 3: Send callback
    console.log("📍 Step 3: Sending payment callback...");
    const callbackResponse = await fetch(`${baseURL}/payments/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
      body: JSON.stringify({
        order_id: orderData.orderId,
        transaction_id: `TXN_${Date.now()}`,
        amount: transferAmountVnd,
        status: "SUCCESS",
        signature: signatureData.signature,
      }),
    });

    if (!callbackResponse.ok) {
      throw new Error(`Callback failed: ${callbackResponse.status}`);
    }

    const callbackData = await callbackResponse.json();
    console.log("✅ Callback sent:", callbackData);
    console.log(`  Status: ${callbackData.status}\n`);

    // Wait for backend processing
    console.log("⏳ Waiting for backend to process...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Step 4: Check wallet
    console.log("📍 Step 4: Checking wallet balance...");
    const walletResponse = await fetch(`${baseURL}/wallet/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!walletResponse.ok) {
      throw new Error(`Get wallet failed: ${walletResponse.status}`);
    }

    const walletData = await walletResponse.json();
    console.log("✅ Wallet updated:", walletData);
    console.log(`  Balance: ${walletData.balance.toLocaleString("vi-VN")} hoa`);
    console.log(
      `  Quy đổi: ${(walletData.balance * 1000).toLocaleString("vi-VN")}đ\n`,
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ TEST COMPLETED SUCCESSFULLY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return {
      orderId: orderData.orderId,
      amount: orderData.amount,
      finalBalance: walletData.balance,
      Kimbap: walletData.balance,
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

/**
 * Quick test - Copy to console:
 * (async () => { await manualPaymentTest(); })();
 *
 * Or if you have the module imported:
 * manualPaymentTest().then(result => console.log('Final result:', result));
 */
