export function validateSleepLog(log) {
  return log.hours >= 0 && log.hours <= 12 && log.mood.length > 0;
}