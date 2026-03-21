/**
 * usePaymentTestFlow Hook
 * Provides payment test flow functionality with loading/error states
 */

import { useState } from "react";
import {
  runPaymentTestFlow,
  PaymentTestFlowResult
} from "@/lib/paymentTestFlow";

export function usePaymentTestFlow() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentTestFlowResult | null>(null);

  const executeTestFlow = async (amount: number) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await runPaymentTestFlow(amount);
      setResult(testResult);
      return testResult;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment test flow failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setError(null);
    setResult(null);
  };

  return {
    executeTestFlow,
    isLoading,
    error,
    result,
    resetState
  };
}
