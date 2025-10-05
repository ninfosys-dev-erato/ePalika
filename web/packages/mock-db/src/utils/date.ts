export function nowISO() {
  return new Date().toISOString();
}
export function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
