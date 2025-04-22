export interface Journal {
  id: string; // UUID
  user_id: number;
  title: string;
  description: string | null;
  slug: string | null;
  public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJournal {
  user_id: number;
  title: string;
  description?: string;
  slug?: string;
  public?: boolean;
}

export interface UpdateJournal {
  title?: string;
  description?: string;
  slug?: string;
  public?: boolean;
}