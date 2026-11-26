export function formatTime(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const match =
    /T(\d{2}:\d{2})/.exec(value);

  return match
    ? match[1]
    : null;
}
