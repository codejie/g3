import { resolve } from 'path';

export interface LogEntry {
  type: string;
  content: string;
  userId?: string;
}

export function log(entry: LogEntry) {
  console.log(`[${entry.type}] ${entry.content}`, entry.userId ? `(User: ${entry.userId})` : '');
}

let _opencodeConfigDir: string | null = null;
export function getOpencodeConfigDir(): string {
  if (_opencodeConfigDir) return _opencodeConfigDir;
  _opencodeConfigDir = process.env.VITE_OPENCODE_CONFIG_PATH
    ? resolve(process.env.VITE_OPENCODE_CONFIG_PATH.replace(/^~/, process.env.HOME || ''))
    : resolve(process.env.HOME || '/root', '.config/opencode');
  return _opencodeConfigDir;
}
