import { query } from '../db';
import { Feature, CreateFeature, UpdateFeature } from '../models/Feature';

export const featureRepository = {
  /**
   * Find all features
   */
  findAll: async (): Promise<Feature[]> => {
    const result = await query('SELECT * FROM features');
    return result.rows;
  },
  
  /**
   * Find a feature by ID
   */
  findById: async (id: number): Promise<Feature | null> => {
    const result = await query(
      'SELECT * FROM features WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },
  
  /**
   * Find a feature by name
   */
  findByName: async (name: string): Promise<Feature | null> => {
    const result = await query(
      'SELECT * FROM features WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  },
  
  /**
   * Create a new feature
   */
  create: async (featureData: CreateFeature): Promise<Feature> => {
    const result = await query(
      'INSERT INTO features (name, enabled, description) VALUES ($1, $2, $3) RETURNING *',
      [
        featureData.name,
        featureData.enabled !== undefined ? featureData.enabled : false,
        featureData.description || null
      ]
    );
    return result.rows[0];
  },
  
  /**
   * Update an existing feature
   */
  update: async (id: number, featureData: UpdateFeature): Promise<Feature | null> => {
    const sets = [];
    const values = [];
    let paramIndex = 1;
    
    if (featureData.name !== undefined) {
      sets.push(`name = $${paramIndex}`);
      values.push(featureData.name);
      paramIndex++;
    }
    
    if (featureData.enabled !== undefined) {
      sets.push(`enabled = $${paramIndex}`);
      values.push(featureData.enabled);
      paramIndex++;
    }
    
    if (featureData.description !== undefined) {
      sets.push(`description = $${paramIndex}`);
      values.push(featureData.description);
      paramIndex++;
    }
    
    if (sets.length === 0) {
      return await featureRepository.findById(id);
    }
    
    sets.push(`updated_at = NOW()`);
    
    values.push(id);
    const result = await query(
      `UPDATE features SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },
  
  /**
   * Toggle a feature by name
   */
  toggleByName: async (name: string, enabled: boolean): Promise<Feature | null> => {
    const result = await query(
      'UPDATE features SET enabled = $1, updated_at = NOW() WHERE name = $2 RETURNING *',
      [enabled, name]
    );
    return result.rows[0] || null;
  }
};