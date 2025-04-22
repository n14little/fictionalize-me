export interface JournalEntry {
  id: string; // UUID
  journal_id: string; // UUID
  title: string;
  content: string;
  mood: string | null;
  location: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJournalEntry {
  journal_id: string;
  title: string;
  content: string;
  mood?: string;
  location?: string;
}

export interface UpdateJournalEntry {
  title?: string;
  content?: string;
  mood?: string;
  location?: string;
}