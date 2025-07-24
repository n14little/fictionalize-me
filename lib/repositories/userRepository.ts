import { query } from '../db';
import { User, CreateUser } from '../models/User';

export const userRepository = {
  /**
   * Find a user by their ID
   */
  findById: async (id: number): Promise<User | null> => {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Find a user by their external user ID
   */
  findByExternalId: async (externalId: string): Promise<User | null> => {
    const result = await query(
      'SELECT * FROM users WHERE external_user_id = $1',
      [externalId]
    );
    return result.rows[0] || null;
  },

  /**
   * Find a user by their email
   */
  findByEmail: async (email: string): Promise<User | null> => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  /**
   * Create a new user
   */
  create: async (userData: CreateUser): Promise<User> => {
    const result = await query(
      'INSERT INTO users (email, external_user_id) VALUES ($1, $2) RETURNING *',
      [userData.email, userData.external_user_id]
    );
    return result.rows[0];
  },

  /**
   * Find a user by external ID, or create if they don't exist
   */
  findOrCreate: async (userData: CreateUser): Promise<User> => {
    const existingUser = await userRepository.findByExternalId(
      userData.external_user_id
    );
    if (existingUser) {
      return existingUser;
    }
    return await userRepository.create(userData);
  },
};
