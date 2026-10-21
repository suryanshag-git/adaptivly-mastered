// Minimal stub for server action helper
// In the real project this would integrate with the framework’s server‑action system.
// For now we simply return the provided handler unchanged, allowing TypeScript to resolve the import.

export function createServerAction<T extends (...args: any[]) => any>(handler: T): T {
  return handler;
}
