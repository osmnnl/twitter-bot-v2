export interface ScheduleProfile {
  targetPostsPerDay: number;
  allowedHours: number[];
  minGapHours: number;
  randomDelayMinutes: number;
  accountOverrides?: Record<string, Partial<ScheduleProfile>>;
}
