import type { FastifyRequest, FastifyReply } from 'fastify';
import { listFiles, deleteFile, downloadFile, uploadFile, getFilePath, ensureWorkspace, readFileContent, readOpencodeConfig, saveOpencodeConfig, downloadOpencodeConfig } from './model';
import { existsSync, statSync, readdirSync } from 'fs';
import type { GetFilesRequest, DeleteFileRequest, DownloadFileRequest } from '../../apis/extension/types/file';
import { unlink } from 'fs/promises';
import { resolve, basename } from 'path';
import { getProjectWorkspacePath } from '../project/handler';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  NOT_FOUND: -5,
};

export async function getFilesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { project_id, path } = request.body as GetFilesRequest;
  const userId = (request as any).userId;

  if (!project_id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID is required',
    });
  }

  const workspace = getProjectWorkspacePath(userId, project_id);
  await ensureWorkspace(userId, project_id);
  const targetDir = path ? getFilePath(userId, project_id, path) : workspace;

  console.log(`[File] getFiles — userId: ${userId}, projectId: ${project_id}, path: ${path || '(root)'}`);
  console.log(`[File] workspace root: ${workspace}`);
  console.log(`[File] target directory: ${targetDir}`);
  console.log(`[File] target exists: ${existsSync(targetDir)}`);

  if (existsSync(targetDir)) {
    try {
      const dirStat = statSync(targetDir);
      console.log(`[File] target isDirectory: ${dirStat.isDirectory()}`);
      if (dirStat.isDirectory()) {
        const rawEntries = readdirSync(targetDir, { withFileTypes: true });
        console.log(`[File] raw entries in directory: ${rawEntries.map(e => `${e.name}(${e.isDirectory() ? 'dir' : 'file'})`).join(', ') || '(empty)'}`);
      }
    } catch (e: any) {
      console.log(`[File] stat/readdir error: ${e.message}`);
    }
  }

  try {
    const items = await listFiles(userId, project_id, path);
    console.log(`[File] listFiles returned ${items.length} items: ${items.map(i => `${i.name}(${i.type})`).join(', ') || '(empty)'}`);
    return reply.send({
      code: RESPONSE_CODES.SUCCESS,
      data: { items },
    });
  } catch (error: any) {
    console.error(`[File] listFiles error: ${error.message}`);
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: error.message || 'Failed to list files',
    });
  }
}

export async function deleteFileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { project_id, path } = request.body as DeleteFileRequest;
  const userId = (request as any).userId;

  if (!project_id || !path) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID and path are required',
    });
  }

  try {
    await deleteFile(userId, project_id, path);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: error.message || 'Failed to delete file',
    });
  }
}

export async function readFileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { project_id, path } = request.body as { project_id: string; path: string };
  const userId = (request as any).userId;

  if (!project_id || !path) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID and path are required',
    });
  }

  try {
    const result = await readFileContent(userId, project_id, path);
    return reply.send({
      code: RESPONSE_CODES.SUCCESS,
      data: result,
    });
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: error.message || 'Failed to read file',
    });
  }
}

export async function downloadFileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { project_id, path } = request.body as DownloadFileRequest;
  const userId = (request as any).userId;

  if (!project_id || !path) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID and path are required',
    });
  }

  try {
    const result = await downloadFile(userId, project_id, path);

    const stream = result.stream as NodeJS.ReadableStream;
    const filename = encodeURIComponent(result.filename);

    reply.raw.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (result.isDirectory) {
      reply.raw.setHeader('Content-Type', 'application/gzip');
    } else {
      const fullPath = getFilePath(userId, project_id, path);
      const fileStat = statSync(fullPath);
      const ext = basename(fullPath).split('.').pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        json: 'application/json', txt: 'text/plain', md: 'text/markdown',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
        pdf: 'application/pdf', zip: 'application/zip',
      };
      reply.raw.setHeader('Content-Type', mimeMap[ext || ''] || 'application/octet-stream');
      reply.raw.setHeader('Content-Length', fileStat.size);
    }

    const requestOrigin = request.headers.origin || '*';
  reply.raw.setHeader('Access-Control-Allow-Origin', requestOrigin);
  reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');

  reply.hijack();
    stream.pipe(reply.raw);

    stream.on('end', () => {
      if (result.isDirectory) {
        const tmpDir = resolve(process.cwd(), 'data/tmp');
        const archivePath = resolve(tmpDir, `${project_id}-${Date.now()}`);
        unlink(archivePath).catch(() => {});
      }
    });

    stream.on('error', (err) => {
      console.error('Download stream error:', err);
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500);
      }
      reply.raw.end();
    });
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: error.message || 'Failed to download file',
    });
  }
}

export async function uploadFileHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).userId;
  const data = await request.file();

  if (!data) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'No file uploaded',
    });
  }

  const projectId = data.fields['project_id']?.value as string;
  const path = data.fields['path']?.value as string;

  if (!projectId || !path) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID and path are required',
    });
  }

  try {
    const buffer = await data.toBuffer();
    await uploadFile(userId, projectId, path, buffer, data.filename);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: error.message || 'Failed to upload file',
    });
  }
}

export async function readOpencodeConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.body as { name: string };

  if (!name) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'Config file name is required' });
  }

  try {
    const result = readOpencodeConfig(name);
    return reply.send({ code: RESPONSE_CODES.SUCCESS, data: result });
  } catch (error: any) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: error.message });
  }
}

export async function saveOpencodeConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name, content } = request.body as { name: string; content: string };

  if (!name || content === undefined) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'Config file name and content are required' });
  }

  try {
    saveOpencodeConfig(name, content);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: error.message });
  }
}

export async function downloadOpencodeConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.body as { name: string };

  if (!name) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'Config file name is required' });
  }

  try {
    const result = downloadOpencodeConfig(name);
    const stream = result.stream as NodeJS.ReadableStream;
    const filename = encodeURIComponent(result.filename);

    reply.raw.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    reply.raw.setHeader('Content-Type', 'application/json');

    const requestOrigin = request.headers.origin || '*';
    reply.raw.setHeader('Access-Control-Allow-Origin', requestOrigin);
    reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');

    reply.hijack();
    stream.pipe(reply.raw);
  } catch (error: any) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: error.message });
  }
}

export async function uploadOpencodeConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await request.file();

  if (!data) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'No file uploaded' });
  }

  const name = (data.fields['name']?.value as string) || 'opencode.json';

  if (!name.endsWith('.json')) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'Only .json config files are supported' });
  }

  try {
    const buffer = await data.toBuffer();
    const content = buffer.toString('utf-8');
    saveOpencodeConfig(name, content);
    console.log(`[File] OpenCode config uploaded: ${name}`);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: error.message });
  }
}
