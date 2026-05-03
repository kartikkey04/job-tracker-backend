export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  refresh_token: string | null;
  created_at: Date;
}

export type JobStatus =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  job_description: string | null;
  status: JobStatus;
  applied_date: Date;
  interview_date: Date | null;
  salary_range: string | null;
  job_url: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface StatusHistory {
  id: string;
  job_id: string;
  old_status: JobStatus | null;
  new_status: JobStatus;
  changed_at: Date;
  note: string | null;
}

// Request body types
export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateJobBody {
  company_name: string;
  role_title: string;
  job_description?: string;
  status?: JobStatus;
  applied_date?: string;
  interview_date?: string;
  salary_range?: string;
  job_url?: string;
  notes?: string;
}

export interface UpdateJobBody extends Partial<CreateJobBody> {
  status?: JobStatus;
}

export interface AICoverLetterBody {
  job_description: string;
  role_title: string;
  company_name: string;
}

export interface AIInterviewTipsBody {
  job_description: string;
  role_title: string;
  company_name: string;
}

export interface AIResumeMatchBody {
  resume_text: string;
  job_description: string;
}

// JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
}

// Express augmentation — adds user to Request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
