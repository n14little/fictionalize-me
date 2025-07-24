export interface Feature {
  id: number;
  name: string;
  enabled: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFeature {
  name: string;
  enabled?: boolean;
  description?: string;
}

export interface UpdateFeature {
  name?: string;
  enabled?: boolean;
  description?: string;
}
