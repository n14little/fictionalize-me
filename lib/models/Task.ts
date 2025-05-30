// Task model interface definitions
export interface Task {
  id: string; // UUID
  journal_id: string; // UUID
  user_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTask {
  journal_id: string;
  user_id: number;
  title: string;
  description?: string;
}

export interface UpdateTask {
  title?: string;
  description?: string;
  completed?: boolean;
  completed_at?: Date | null;
}
