export default function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU").format(date);
}
