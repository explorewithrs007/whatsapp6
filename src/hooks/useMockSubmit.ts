import { useCallback, useState } from "react";

type MockSubmitOptions = {
  delay?: number;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
};

export function useMockSubmit(delay = 500) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const run = useCallback(
    async (action: () => void | Promise<void>, options: MockSubmitOptions = {}) => {
      if (isSubmitting) {
        return false;
      }

      setIsSubmitting(true);

      try {
        await new Promise((resolve) => window.setTimeout(resolve, options.delay ?? delay));
        await action();
        options.onSuccess?.();
        return true;
      } catch (error) {
        options.onError?.(error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [delay, isSubmitting],
  );

  return { isSubmitting, run };
}
