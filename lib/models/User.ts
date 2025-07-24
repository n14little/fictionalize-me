export interface User {
  id: number;
  email: string;
  external_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUser {
  email: string;
  external_user_id: string;
}
