"use client";

import { useState, useCallback } from "react";
import { AnalyzeResponse, Chain } from "@/lib/types";
import { analyzeToken } from "@/lib/api";

interface AnalysisState {
  data: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    data: null,
    loading: false,
    error: null,
  });

  const analyze = useCallback(async (chain: Chain, tokenAddress: string) => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await analyzeToken({
        chain,
        token_address: tokenAddress,
      });
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Analysis failed",
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, analyze, reset };
}
