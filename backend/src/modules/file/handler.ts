import type { FastifyRequest, FastifyReply } from 'fastify';
import { listFiles, deleteFile, downloadFile, uploadFile, saveUploadedFile, getFilePath } from './model';
import { existsSync, statSync } from 'fs';
import type { GetFilesRequest, DeleteFileRequest, DownloadFileRequest } from '../../apis/extension/types/file';
import { unlink, rm } from 'fs/promises';
import { resolve, dirname, basename } from 'path';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  NOT_FOUND: -5,
};

export async function getFilesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { project_id, path } = request.body as GetFilesRequest;

  if (!project_id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID is required',
    });
  }

  try {
    const items = await listFiles(project_id, path);
    return reply.send({
      code: RESPONSE_CODES.SUCCESS,
      data: { items },
    });
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: error.message || 'Failed to list files',
    });
  }
}

export async function deleteFileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { project_id, path } = request.body as DeleteFileRequest;

  if (!project_id || !path) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID and path are required',
    });
  }

  try {
    await deleteFile(project_id, path);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: error.message || 'Failed to delete file',
    });
  }
}

export async function downloadFileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { project_id, path } = request.body as DownloadFileRequest;

  if (!project_id || !path) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID and path are required',
    });
  }

  try {
    const result = await downloadFile(project_id, path);

    const stream = result.stream as NodeJS.ReadableStream;
    const filename = encodeURIComponent(result.filename);

    reply.raw.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (result.isDirectory) {
      reply.raw.setHeader('Content-Type', 'application/gzip');
    } else {
      const fullPath = getFilePath(project_id, path);
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
    await uploadFile(projectId, path, buffer, data.filename);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: error.message || 'Failed to upload file',
    });
  }
}
