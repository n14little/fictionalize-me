import { query } from '../db';
import { QueryFunction } from '../db/types';
import { User, CreateUser } from '../models/User';

export const createUserRepository = (queryFn: QueryFunction) => {
  return {
    /**
     * Find a user by their ID
     */
    findById: async (id: number): Promise<User | null> => {
      const result = await queryFn('SELECT * FROM users WHERE id = $1', [id]);
      return (result.rows[0] as User) || null;
    },

    /**
     * Find a user by their external user ID
     */
    findByExternalId: async (externalId: string): Promise<User | null> => {
      const result = await queryFn(
        'SELECT * FROM users WHERE external_user_id = $1',
        [externalId]
      );
      return (result.rows[0] as User) || null;
    },

    /**
     * Find a user by their email
     */
    findByEmail: async (email: string): Promise<User | null> => {
      const result = await queryFn('SELECT * FROM users WHERE email = $1', [email]);
      return (result.rows[0] as User) || null;
    },

    /**
     * Create a new user
     */
    create: async (userData: CreateUser): Promise<User> => {
      const result = await queryFn(
        'INSERT INTO users (email, external_user_id) VALUES ($1, $2) RETURNING *',
        [userData.email, userData.external_user_id]
      );
      return result.rows[0] as User;
    },

    /**
     * Find a user by external ID, or create if they don't exist
     */
    findOrCreate: async (userData: CreateUser): Promise<User> => {
      const result = await queryFn(
        `INSERT INTO users (email, external_user_id) 
         VALUES ($1, $2) 
         ON CONFLICT (external_user_id) 
         DO UPDATE SET email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userData.email, userData.external_user_id]
      );
      return result.rows[0] as User;
    },
  };
};

// Create the default instance using the default query function
export const userRepository = createUserRepository(query);
