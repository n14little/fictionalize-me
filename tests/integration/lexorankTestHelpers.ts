// Helper functions for lexorank comparisons in tests

export function isHigherPriority(a: string, b: string): boolean {
  // In lexorank, higher priority = lexically smaller string
  return a < b;
}

export function isLowerPriority(a: string, b: string): boolean {
  // In lexorank, lower priority = lexically larger string  
  return a > b;
}

export function expectHigherPriority(a: string, b: string): void {
  expect(a < b).toBe(true);
}

export function expectLowerPriority(a: string, b: string): void {
  expect(a > b).toBe(true);
}

export function sortTasksByPriority<T extends { priority: string }>(tasks: T[]): T[] {
  return tasks.sort((a, b) => a.priority.localeCompare(b.priority));
}