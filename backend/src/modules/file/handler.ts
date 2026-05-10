import type { FastifyRequest, FastifyReply } from 'fastify';
import type { MultipartValue } from '@fastify/multipart';
import { listFiles, deleteFile, downloadFile, uploadFile, getFilePath, ensureWorkspace, readFileContent, readOpencodeConfig, saveOpencodeConfig, downloadOpencodeConfig } from './model.js';
import { statSync } from 'fs';
import type { GetFilesRequest, DeleteFileRequest, DownloadFileRequest } from '../../apis/extension/types/file';
import { basename } from 'path';

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

  await ensureWorkspace(userId, project_id);

  try {
    const items = await listFiles(userId, project_id, path);
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
          reply.raw.setHeader('Content-Type', 'application/zip');
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

const projectId = (data.fields['project_id'] as MultipartValue<string> | undefined)?.value;
const path = (data.fields['path'] as MultipartValue<string> | undefined)?.value;

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

  const name = ((data.fields['name'] as MultipartValue<string> | undefined)?.value as string) || 'opencode.json';

  if (!name.endsWith('.json')) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'Only .json config files are supported' });
  }

  try {
    const buffer = await data.toBuffer();
    const content = buffer.toString('utf-8');
    saveOpencodeConfig(name, content);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: error.message });
  }
}
