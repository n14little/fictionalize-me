export interface WaitlistEntry {
  id: number;
  email: string;
  interest: string | null;
  created_at: Date;
}

export interface CreateWaitlistEntry {
  email: string;
  interest?: string;
}