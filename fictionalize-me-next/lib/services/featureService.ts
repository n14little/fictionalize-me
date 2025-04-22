import { Feature } from '../models/Feature';
import { featureRepository } from '../repositories/featureRepository';

export const featureService = {
  /**
   * Get all features
   */
  getAllFeatures: async (): Promise<Feature[]> => {
    return featureRepository.findAll();
  },
  
  /**
   * Check if a feature is enabled
   */
  isEnabled: async (name: string): Promise<boolean> => {
    const feature = await featureRepository.findByName(name);
    return feature?.enabled || false;
  },
  
  /**
   * Enable or disable a feature
   */
  toggleFeature: async (name: string, enabled: boolean): Promise<Feature | null> => {
    return featureRepository.toggleByName(name, enabled);
  },
  
  /**
   * Create a new feature
   */
  createFeature: async (name: string, enabled: boolean = false, description?: string): Promise<Feature> => {
    return featureRepository.create({
      name,
      enabled,
      description
    });
  }
};