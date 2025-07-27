export type RecurrenceType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

export interface ReferenceTask {
  id: string;
  user_id: number;
  journal_id: string;
  title: string;
  description: string | null;

  // Recurrence settings
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_days_of_week: number[] | null; // [0-6] where 0=Sunday
  recurrence_day_of_month: number | null; // 1-31
  recurrence_week_of_month: number | null; // 1-5

  starts_on: Date;
  ends_on: Date | null;
  is_active: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface CreateReferenceTask {
  user_id: number;
  journal_id: string;
  title: string;
  description?: string;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
  recurrence_week_of_month?: number;
  starts_on: Date;
  ends_on?: Date;
  is_active?: boolean;
}

export interface UpdateReferenceTask {
  title?: string;
  description?: string;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
  recurrence_week_of_month?: number;
  starts_on?: Date;
  ends_on?: Date;
  is_active?: boolean;
}
