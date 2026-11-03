/** Relay status string for a normal open session. */
export const NORMAL_OPEN = "NORMAL_OPEN";

/** NSE cash session in IST: weekdays, 9:15 to 15:30. */
export function checkIsMarketOpen(now = new Date()): boolean {
  // Directly shift UTC timestamp by +5 hours 30 minutes (19,800,000 ms)
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  // Use UTC getters so server/local OS timezone never interferes
  const day = istTime.getUTCDay();
  if (day === 0 || day === 6) return false;

  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;

  return timeInMinutes >= 555 && timeInMinutes <= 930;
}
