/** Relay status string for a normal open session. */
export const NORMAL_OPEN = "NORMAL_OPEN";

/** NSE cash session in IST: weekdays, 9:15 to 15:30. */
export function checkIsMarketOpen(now = new Date()): boolean {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 5.5 * 3600000);

  const day = istDate.getDay();
  if (day === 0 || day === 6) return false;

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  return timeInMinutes >= 555 && timeInMinutes <= 930;
}
