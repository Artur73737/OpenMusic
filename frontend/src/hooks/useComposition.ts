import { useCallback, useState } from "react";

import { compositionService } from "@/services/compositionService";
import { Composition } from "@/types/music";

export interface GenerateParams {
  prompt: string;
  model?: string;
  duration_seconds?: number;
  bpm?: number;
}

export function useComposition() {
  const [composition, setComposition] =
    useState<Composition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: GenerateParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          await compositionService.generateComposition(
            params
          );
        setComposition(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setComposition(null);
    setError(null);
  }, []);

  const updateComposition = useCallback(
    (newComposition: Composition) => {
      setComposition(newComposition);
    },
    []
  );

  return {
    composition,
    isLoading,
    error,
    generate,
    clear,
    updateComposition,
  };
}
