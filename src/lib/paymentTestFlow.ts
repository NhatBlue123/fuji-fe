/**
 * Payment Test Flow Utility
 * Simulates OTP Payment flow for testing:
 * 1. Create payment order
 * 2. Get test signature
 * 3. Send XGate callback
 * 4. Check wallet balance
 */

import api from "@/lib/api";

export interface PaymentTestFlowResult {
  orderId: string;
  amount: number;
  signature: string;
  callbackStatus: string;
  newBalance: number;
  Kimbap: number;
}

/**
 * Step 1: Create payment order and get orderId
 */
export async function createPaymentOrder(amount: number): Promise<{
  orderId: string;
  amount: number;
  bankId: string;
  accountNo: string;
  accountName: string;
}> {
  try {
    const response = await api.post("/payments/create", { amount });
    console.log("✅ Step 1 - Payment Order Created:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Step 1 Failed - Create Payment Order:", error);
    throw error;
  }
}

/**
 * Step 2: Get test signature from backend for callback simulation
 */
export async function getTestSignature(
  orderId: string,
  amount: number,
  status: string = "SUCCESS",
): Promise<{ signature: string }> {
  try {
    const response = await api.get("/payments/test-signature", {
      params: {
        order_id: orderId,
        amount: amount,
        status: status,
      },
    });
    console.log("✅ Step 2 - Test Signature Retrieved:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Step 2 Failed - Get Test Signature:", error);
    throw error;
  }
}

/**
 * Step 3: Send XGate callback to complete payment
 * This simulates when XGate sends payment success callback to backend
 */
export async function sendPaymentCallback(
  orderId: string,
  amount: number,
  signature: string,
  transactionId: string = "TXN_TEST_" + Date.now(),
): Promise<{ status: string; message: string }> {
  try {
    const response = await api.post("/payments/callback", {
      order_id: orderId,
      transaction_id: transactionId,
      amount: amount,
      status: "SUCCESS",
      signature: signature,
    });
    console.log("✅ Step 3 - Callback Sent Successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Step 3 Failed - Send Payment Callback:", error);
    throw error;
  }
}

/**
 * Step 4: Check wallet balance (verify Kimbap added)
 */
export async function checkWalletBalance(): Promise<{
  balance: number;
  Kimbap: number;
}> {
  try {
    const response = await api.get("/wallet/me");
    console.log("✅ Step 4 - Wallet Balance:", response.data);
    return {
      balance: response.data.balance || 0,
      Kimbap: Math.floor((response.data.balance || 0) / 1000),
    };
  } catch (error) {
    console.error("❌ Step 4 Failed - Check Wallet:", error);
    throw error;
  }
}

/**
 * Complete OTP Payment Test Flow
 * Executes: Create → GetSignature → SendCallback → CheckBalance
 */
export async function runPaymentTestFlow(
  amount: number,
): Promise<PaymentTestFlowResult> {
  console.log("\n🚀 Starting OTP Payment Test Flow...\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Step 1: Create payment order
    console.log(`\n📍 STEP 1: Creating payment order (Amount: ${amount}đ)...`);
    const orderData = await createPaymentOrder(amount);

    // Step 2: Get test signature
    console.log(
      `\n📍 STEP 2: Getting test signature (OrderID: ${orderData.orderId})...`,
    );
    const signatureData = await getTestSignature(orderData.orderId, amount);

    // Step 3: Send callback
    console.log(`\n📍 STEP 3: Sending payment callback...`);
    const callbackResponse = await sendPaymentCallback(
      orderData.orderId,
      amount,
      signatureData.signature,
    );

    // Step 4: Wait a moment for backend to process
    console.log(`\n⏳ Waiting for backend to process payment (1.5 seconds)...`);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Step 5: Check wallet balance
    console.log(`\n📍 STEP 4: Checking wallet balance...`);
    const walletData = await checkWalletBalance();

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ OTP PAYMENT TEST FLOW COMPLETED SUCCESSFULLY!\n");
    console.log("📊 Results Summary:");
    console.log(`   - OrderID: ${orderData.orderId}`);
    console.log(`   - Amount: ${amount.toLocaleString("vi-VN")}đ`);
    console.log(
      `   - Signature: ${signatureData.signature.substring(0, 20)}...`,
    );
    console.log(`   - Callback Status: ${callbackResponse.status}`);
    console.log(
      `   - New Balance: ${walletData.balance.toLocaleString("vi-VN")}đ`,
    );
    console.log(`   - Kimbap Added: ${walletData.Kimbap} �\n`);

    return {
      orderId: orderData.orderId,
      amount: amount,
      signature: signatureData.signature,
      callbackStatus: callbackResponse.status,
      newBalance: walletData.balance,
      Kimbap: walletData.Kimbap,
    };
  } catch (error) {
    console.error(
      "\n❌ OTP PAYMENT TEST FLOW FAILED!\n",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}
