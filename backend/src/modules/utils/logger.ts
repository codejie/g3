export interface LogEntry {
  type: string;
  content: string;
  userId?: number;
}

export function log(entry: LogEntry) {
  console.log(`[${entry.type}] ${entry.content}`, entry.userId ? `(User: ${entry.userId})` : '');
}
