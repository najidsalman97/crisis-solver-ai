export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    // Fallback: use any global error beacon if present, otherwise console.error
    // This keeps behaviour minimal and avoids third-party vendor coupling.
    (window as any).__appErrorEvents?.captureException?.(error, context);
  } catch {}
  console.error(error, context);
}

export default reportError;
