const percentage = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
  style: 'percent',
});
const runDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatMatchScore(score) {
  return percentage.format(score / 100);
}

export function formatMatchDate(date) {
  return runDate.format(new Date(date));
}
