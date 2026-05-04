import type { FastifyRequest, FastifyReply } from 'fastify';
import { createReadStream, unlinkSync } from 'fs';
import { deploySkillPackage, packSkillDirectory, removeSkill, resolveSkillPath } from './model.js';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  SERVER_ERROR: -2,
};

export async function uploadSkillHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await request.file();

  if (!data) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'No file uploaded',
    });
  }

  const filename = data.filename;
  const isTarGz = filename.endsWith('.tar.gz') || filename.endsWith('.tgz') || filename.endsWith('.gz');
  const isZip = filename.endsWith('.zip');

  if (!isTarGz && !isZip) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Only .tar.gz and .zip files are supported',
    });
  }

  try {
    const buffer = await data.toBuffer();
    const result = await deploySkillPackage(buffer, filename);
    console.log(`[Skill] Deployed: ${result.skillName} → ${result.skillPath}`);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    console.error(`[Skill] Upload failed: ${error.message}`);
    return reply.send({
      code: RESPONSE_CODES.SERVER_ERROR,
      message: error.message || 'Failed to deploy skill package',
    });
  }
}

export async function downloadSkillHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.body as { name?: string };

  if (!name) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Skill name is required',
    });
  }

  const skillDirPath = resolveSkillPath(name);
  if (!skillDirPath) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: `Skill not found: ${name}`,
    });
  }

  let archivePath: string;
  try {
    archivePath = packSkillDirectory(skillDirPath);
  } catch (error: any) {
    console.error(`[Skill] Pack failed: ${error.message}`);
    return reply.send({
      code: RESPONSE_CODES.SERVER_ERROR,
      message: error.message || 'Failed to pack skill',
    });
  }

  const fileName = `${name}.tar.gz`;
  const stream = createReadStream(archivePath);

  reply.header('Content-Type', 'application/gzip');
  reply.header('Content-Disposition', `attachment; filename="${fileName}"`);

  stream.on('end', () => { try { unlinkSync(archivePath); } catch { /* best-effort */ } });
  stream.on('error', () => { try { unlinkSync(archivePath); } catch { /* best-effort */ } });

  return reply.send(stream);
}

export async function deleteSkillHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.body as { name?: string };

  if (!name) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Skill name is required',
    });
  }

  const skillDirPath = resolveSkillPath(name);
  if (!skillDirPath) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: `Skill not found: ${name}`,
    });
  }

  try {
    await removeSkill(skillDirPath);
    return reply.send({ code: RESPONSE_CODES.SUCCESS });
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.SERVER_ERROR,
      message: error.message || 'Failed to delete skill',
    });
  }
}
