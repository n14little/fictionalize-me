// Task model interface definitions
export interface Task {
  id: string; // UUID
  journal_id: string; // UUID
  user_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  completed_at: Date | null;
  priority: string; // Lexorank string for ordering
  reference_task_id: string | null; // Link to recurring task template
  recurrence_type: number | null; // 1=daily, 2=weekly, 3=monthly, 4=yearly, 5=custom, 6=regular
  scheduled_date: Date | null; // When this recurring task instance is due
  parent_task_id: string | null; // Reference to parent task for sub-tasks
  created_at: Date;
  updated_at: Date;
}

export interface CreateTask {
  journal_id: string;
  user_id: number;
  title: string;
  description?: string;
  priority?: string;
  reference_task_id?: string;
  recurrence_type?: number;
  scheduled_date?: Date;
  parent_task_id?: string;
}

export interface UpdateTask {
  title?: string;
  description?: string;
  completed?: boolean;
  completed_at?: Date | null;
  priority?: string;
  reference_task_id?: string;
  recurrence_type?: number;
  scheduled_date?: Date;
  parent_task_id?: string;
}

export type TaskBucket =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'
  | 'regular'
  | 'missed';

// Mapping from recurrence type integers to bucket names
export const RECURRENCE_TYPE_TO_BUCKET: Record<number, TaskBucket> = {
  1: 'daily',
  2: 'weekly',
  3: 'monthly',
  4: 'yearly',
  5: 'custom',
  6: 'regular',
  7: 'missed',
};

// Mapping from bucket names to recurrence type integers
export const BUCKET_TO_RECURRENCE_TYPE: Record<TaskBucket, number> = {
  daily: 1,
  weekly: 2,
  monthly: 3,
  yearly: 4,
  custom: 5,
  regular: 6,
  missed: 7,
};

export interface BucketedTask extends Task {
  task_bucket: TaskBucket;
}

export interface TaskBuckets {
  daily: BucketedTask[];
  weekly: BucketedTask[];
  monthly: BucketedTask[];
  yearly: BucketedTask[];
  custom: BucketedTask[];
  regular: BucketedTask[];
  missed: BucketedTask[];
}
