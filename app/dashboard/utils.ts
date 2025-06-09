import { authService } from '@/lib/services/authService';

/**
 * Gets the current authenticated user ID
 * This is used by parallel routes to avoid multiple auth checks
 * The main page.tsx already handles redirect for unauthenticated users
 */
export async function getCurrentUserId() {
  const user = await authService.getCurrentUser();
  return user?.id;
}
