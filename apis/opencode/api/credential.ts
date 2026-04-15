import { put } from './http'

const GLOBAL_CONFIG_DIR = '/root/.config/opencode'

export async function setCredential(
  providerId: string,
  apiKey: string,
): Promise<boolean> {
  return put<boolean>(`/auth/${providerId}`, { directory: GLOBAL_CONFIG_DIR }, { apiKey })
}
