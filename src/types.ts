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
  attendanceStatus?: string;
  activityName?: string;
  workCompletedPercent?: string;
  targetDate?: string;
  workCompletedTodayPercent?: string;
  noOfLaborSubcontractor?: string;
  equipment?: string;
  remarks?: string;
  images?: string[];
  
  // New Attendance Detail Fields
  isPullOut?: boolean;
  absentReason?: string;
  absentReasonOther?: string;
  underTimeTime?: string;
  underTimeReason?: string;
  underTimeReasonOther?: string;
  pullOutTime?: string;
  pullOutSite?: string;
  pullOutReason?: string;
}

export interface PullOutWorker {
  laborsName: string;
  laborCode: string;
  status: "Present" | "Not Present";
  timeIn?: string;
  timeOut?: string;
}

export interface PullOutMonitoring {
  id: string;
  date: string;
  site: string; // The selected site (e.g., project code or location)
  workers: PullOutWorker[];
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
