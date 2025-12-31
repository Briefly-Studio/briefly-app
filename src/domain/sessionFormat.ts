// src/domain/sessionFormat.ts

export function formatTimestamp(value: number) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatDuration(startedAt: number, finishedAt: number) {
  const diff = Math.max(0, finishedAt - startedAt);
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
