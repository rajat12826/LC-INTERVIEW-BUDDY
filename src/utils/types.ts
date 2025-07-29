// src/types/Question.ts

export interface Question {
  Difficulty: string;
  Question: string;
  'Frequency (Number of Companies)': number;
  'Link of Question': string;
  'Companies Asking This Question': string; // This is a string as per your provided example structure
  Topics: string; // This is a string as per your provided example structure
}
export interface UserProfile {
  id: string; // uuid
  clerk_user_id: string;
  email: string;
  name: string | null;
  is_premium: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_plan: string | null;
  payment_id: string | null;
  payment_status: string | null;
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  leetcode_username: string | null;
}
export type Database = {
  public: {
    Tables: {
      lc_users: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<UserProfile>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};