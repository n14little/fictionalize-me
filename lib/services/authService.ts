import { User } from '../models/User';
import { userRepository } from '../repositories/userRepository';

// Check environment
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Stub authentication service that allows all operations
 * This will be replaced with a real authentication service in the future
 */
export const authService = {
  /**
   * Get the current user from the request
   */
  // In a real implementation, this would validate the token and retrieve the user
  // For non-production environments, use the test user created in migrations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCurrentUser: async (token?: string): Promise<User | null> => {
    if (!isProduction) {
      try {
        // Try to fetch the test user created in our development migrations
        const testUser = await userRepository.findByEmail('test@example.com');
        if (testUser) {
          return testUser;
        }
      } catch (error) {
        console.warn('Could not fetch test user, falling back to stub user', error);
      }
    }

    // Fall back to the stub user in production or if test user wasn't found
    return {
      email: 'stubby@user.com',
      id: 1,
      external_user_id: 'stub-external-id',
      created_at: new Date(),
      updated_at: new Date(),
    };
  },

  /**
   * Check if the current user has access to a specific route
   * Currently allows all operations
   */
  checkAccess: async (/*_userId: number, _resourceId?: string*/): Promise<boolean> => {
    // In a real implementation, this would check if the user has access to the resource
    // For now, we'll allow all operations
    return true;
  },

  /**
   * Generate a token for the user
   */
  generateToken: async (user: User): Promise<string> => {
    // In a real implementation, this would generate a JWT token
    // For now, we'll just return a stub token
    return `stub-token-for-user-${user.id}`;
  }
};