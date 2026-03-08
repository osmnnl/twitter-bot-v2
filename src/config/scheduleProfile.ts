import type { ScheduleProfile } from "../domain/schedule.js";

export const defaultScheduleProfile: ScheduleProfile = {
  targetPostsPerDay: 12,
  allowedHours: Array.from({ length: 24 }, (_, index) => index),
  minGapHours: 2,
  randomDelayMinutes: 119,
};

export function isAllowedHour(profile: ScheduleProfile, now = new Date()): boolean {
  return profile.allowedHours.includes(now.getHours());
}

export function calculateRandomDelayMs(
  profile: ScheduleProfile,
  random: () => number = Math.random,
): number {
  if (profile.randomDelayMinutes <= 0) {
    return 0;
  }

  const delayMinutes = Math.floor(random() * (profile.randomDelayMinutes + 1));
  return delayMinutes * 60 * 1000;
}
