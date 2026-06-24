export interface Submission {
  id: string;
  date: string;
  project: string;
  laborsName: string;
  designation: string;
  projectLocation: string;
  siteEngineer: string;
  reassignedTask: string;
  createdAt: string;
}

export interface VerificationResponse {
  valid: boolean;
}

export interface SubmissionResponse {
  success: boolean;
  entry?: Submission;
  error?: string;
}
