import type { FastifyRequest, FastifyReply } from 'fastify';
import { execFile } from 'child_process';
import { resolve } from 'path';
import { homedir } from 'os';
import type { ExecuteScriptRequest } from '../../apis/extension/types/system';

function getOpencodeConfigDir(): string {
  const raw = process.env.VITE_OPENCODE_CONFIG_PATH || '';
  const path = raw.startsWith('~') ? raw.replace('~', homedir()) : raw;
  return path || resolve(homedir(), '.config/opencode');
}

const ALLOWED_SCRIPTS: Record<string, string> = {
  restart_opencode: resolve(getOpencodeConfigDir(), 'restart_opencode.sh'),
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
