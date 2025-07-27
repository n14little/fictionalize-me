// Task model interface definitions
export interface Task {
  id: string; // UUID
  journal_id: string; // UUID
  user_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  completed_at: Date | null;
  priority: number;
  reference_task_id: string | null; // Link to recurring task template
  scheduled_date: Date | null; // When this recurring task instance is due
  created_at: Date;
  updated_at: Date;
}

export interface CreateTask {
  journal_id: string;
  user_id: number;
  title: string;
  description?: string;
  priority?: number;
  reference_task_id?: string;
  scheduled_date?: Date;
}

export interface UpdateTask {
  title?: string;
  description?: string;
  completed?: boolean;
  completed_at?: Date | null;
  priority?: number;
  reference_task_id?: string;
  scheduled_date?: Date;
}
