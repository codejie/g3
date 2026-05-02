import type { FastifyRequest, FastifyReply } from 'fastify';
import { execFile } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ExecuteScriptRequest } from '../../apis/extension/types/system';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCRIPTS_DIR = resolve(__dirname, '../../../');

const ALLOWED_SCRIPTS: Record<string, string> = {
  restart_opencode: resolve(SCRIPTS_DIR, 'restart_opencode.sh'),
};

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  NOT_FOUND: -5,
  INTERNAL_ERROR: -7,
};

export async function executeScriptHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.body as ExecuteScriptRequest;

  if (!name) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Script name is required',
    });
  }

  const scriptPath = ALLOWED_SCRIPTS[name];
  if (!scriptPath) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: `Script "${name}" not found or not allowed`,
    });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      execFile('bash', [scriptPath], { timeout: 30000 }, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    return reply.send({
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err: any) {
    return reply.send({
      code: RESPONSE_CODES.INTERNAL_ERROR,
      message: `Script execution failed: ${err.message}`,
    });
  }
}
