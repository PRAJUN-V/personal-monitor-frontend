export interface UserProfile {
  username: string;
  is_admin: boolean;
}

export interface ManagedUser {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface HealthRecord {
  id: number;
  date: string;
  height: number;
  weight: number;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  bmi: number;
  category: string;
  weight_diff_to_normal: number;
}

export interface HealthForm {
  date: string;
  height: string | number;
  weight: string | number;
  bp_systolic: string | number;
  bp_diastolic: string | number;
}

export interface Source {
  id: number;
  name: string;
  balance: number;
}

export interface Transaction {
  id: number;
  source_id: number;
  source_name: string | null;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  description: string | null;
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: "success" | "error";
}
