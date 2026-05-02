import { resolve, join, dirname, basename, extname } from 'path';
import { mkdirSync, existsSync, statSync, readdirSync, unlinkSync, rmdirSync, createReadStream, createWriteStream, readFileSync, writeFileSync } from 'fs';
import { mkdir, rm, stat, readdir, unlink, rmdir } from 'fs/promises';
import { createHash } from 'crypto';
import db from '../../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { getProjectWorkspacePath } from '../project/handler';

const OPENCODE_CONFIG_DIR = process.env.VITE_OPENCODE_CONFIG_PATH
  ? resolve(process.env.VITE_OPENCODE_CONFIG_PATH.replace(/^~/, process.env.HOME || ''))
  : resolve(process.env.HOME || '/root', '.config/opencode');

const DEFAULT_OPENCODE_JSON = JSON.stringify({}, null, 2);
const DEFAULT_CONFIG_JSON = JSON.stringify({}, null, 2);

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);
const BINARY_EXTENSIONS = new Set(['zip', 'tar', 'gz', 'rar', '7z', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'exe', 'dll', 'so', 'dylib', 'woff', 'woff2', 'ttf', 'eot', 'otf', 'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flac', 'ogg', 'wav']);

const MIME_MAP: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon',
};

export function getFilePath(userId: string, projectId: string, relativePath: string): string {
  const workspace = getProjectWorkspacePath(userId, projectId);
  const fullPath = resolve(workspace, relativePath);
  if (!fullPath.startsWith(workspace)) {
    throw new Error('Path traversal detected');
  }
  return fullPath;
}

export async function ensureWorkspace(userId: string, projectId: string): Promise<string> {
  const workspace = getProjectWorkspacePath(userId, projectId);
  if (!existsSync(workspace)) {
    mkdirSync(workspace, { recursive: true });
  }
  return workspace;
}

export async function listFiles(userId: string, projectId: string, relativePath?: string): Promise<any[]> {
  const workspace = getProjectWorkspacePath(userId, projectId);
  const targetDir = relativePath ? getFilePath(userId, projectId, relativePath) : workspace;

  if (!existsSync(targetDir)) {
    return [];
  }

  const dirStat = statSync(targetDir);
  if (!dirStat.isDirectory()) {
    return [];
  }

  const entries = readdirSync(targetDir, { withFileTypes: true });

  return entries.map((entry) => {
    const fullPath = join(targetDir, entry.name);
    const fileStat = statSync(fullPath);
    return {
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      size: entry.isDirectory() ? 0 : fileStat.size,
      created: Math.floor(fileStat.birthtimeMs / 1000),
      updated: Math.floor(fileStat.mtimeMs / 1000),
    };
  });
}

export async function deleteFile(userId: string, projectId: string, relativePath: string): Promise<void> {
  const fullPath = getFilePath(userId, projectId, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error('File or directory not found');
  }

  const fileStat = statSync(fullPath);
  if (fileStat.isDirectory()) {
    await rm(fullPath, { recursive: true });
  } else {
    await unlink(fullPath);
  }
}

export async function downloadFile(userId: string, projectId: string, relativePath: string): Promise<{ stream: NodeJS.ReadableStream; filename: string; isDirectory: boolean }> {
  const fullPath = getFilePath(userId, projectId, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error('File not found');
  }

  const fileStat = statSync(fullPath);

  if (fileStat.isDirectory()) {
    const { execSync } = await import('child_process');
    const tmpDir = resolve(process.cwd(), 'data/tmp');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

    const archiveName = `${basename(fullPath) || 'archive'}.tar.gz`;
  const archivePath = join(tmpDir, `${projectId}-${Date.now()}-${archiveName}`);

  const workspace = getProjectWorkspacePath(userId, projectId);
    const relativeDir = relativePath;

    execSync(`tar -czf "${archivePath}" -C "${workspace}" "${relativeDir}"`, { cwd: workspace });

    return {
      stream: createReadStream(archivePath),
      filename: archiveName,
      isDirectory: true,
    };
  }

  return {
    stream: createReadStream(fullPath),
    filename: basename(fullPath),
    isDirectory: false,
  };
}

export async function readFileContent(userId: string, projectId: string, relativePath: string): Promise<{ content: string; language: string; fileType: 'text' | 'image' | 'binary'; mimeType?: string }> {
  const fullPath = getFilePath(userId, projectId, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error('File not found');
  }

  const fileStat = statSync(fullPath);
  if (fileStat.isDirectory()) {
    throw new Error('Cannot read directory');
  }
  if (fileStat.size > 10 * 1024) {
    throw new Error('File too large to preview (max 10KB)');
  }

  const ext = extname(fullPath).toLowerCase().slice(1);

  if (IMAGE_EXTENSIONS.has(ext)) {
    const buffer = readFileSync(fullPath);
    const base64 = buffer.toString('base64');
    const mimeType = MIME_MAP[ext] || 'application/octet-stream';
    return { content: base64, language: '', fileType: 'image', mimeType };
  }

  if (BINARY_EXTENSIONS.has(ext)) {
    return { content: '', language: '', fileType: 'binary' };
  }

  const content = readFileSync(fullPath, 'utf-8');
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    vue: 'vue', py: 'python', json: 'json', md: 'markdown', html: 'html',
    css: 'css', scss: 'scss', less: 'less', yaml: 'yaml', yml: 'yaml',
    xml: 'xml', sql: 'sql', sh: 'bash', bash: 'bash', go: 'go',
    rs: 'rust', java: 'java', c: 'c', cpp: 'cpp', h: 'c',
    toml: 'toml', ini: 'ini', txt: 'text', log: 'text',
  };

  return { content, language: langMap[ext] || ext || 'text', fileType: 'text' };
}

export async function uploadFile(userId: string, projectId: string, relativePath: string, fileData: Buffer, filename?: string): Promise<void> {
  await ensureWorkspace(userId, projectId);
  const fullPath = getFilePath(userId, projectId, relativePath);

  const dir = filename ? dirname(fullPath) : fullPath;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const targetPath = filename ? fullPath : join(fullPath, filename || 'unnamed');
  const { writeFile } = await import('fs/promises');
  await writeFile(targetPath, fileData);
}

export async function saveUploadedFile(userId: string, projectId: string, relativePath: string, sourcePath: string, filename: string): Promise<void> {
  await ensureWorkspace(userId, projectId);
  const targetDir = getFilePath(userId, projectId, relativePath);

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = join(targetDir, filename);
  const { copyFile } = await import('fs/promises');
  await copyFile(sourcePath, targetPath);
}

export function readOpencodeConfig(name: string): { content: string; name: string } {
  if (!name.endsWith('.json')) {
    throw new Error('Only .json config files are supported');
  }
  const allowedNames = ['opencode.json', 'config.json'];
  if (!allowedNames.includes(name)) {
    throw new Error(`Config file "${name}" is not allowed. Allowed: ${allowedNames.join(', ')}`);
  }

  const filePath = resolve(OPENCODE_CONFIG_DIR, name);
  if (!filePath.startsWith(OPENCODE_CONFIG_DIR)) {
    throw new Error('Path traversal detected');
  }

  if (!existsSync(filePath)) {
    const defaultContent = name === 'opencode.json' ? DEFAULT_OPENCODE_JSON : DEFAULT_CONFIG_JSON;
    return { content: defaultContent, name };
  }

  const content = readFileSync(filePath, 'utf-8');
  return { content, name };
}

export function saveOpencodeConfig(name: string, content: string): void {
  if (!name.endsWith('.json')) {
    throw new Error('Only .json config files are supported');
  }
  const allowedNames = ['opencode.json', 'config.json'];
  if (!allowedNames.includes(name)) {
    throw new Error(`Config file "${name}" is not allowed. Allowed: ${allowedNames.join(', ')}`);
  }

  const filePath = resolve(OPENCODE_CONFIG_DIR, name);
  if (!filePath.startsWith(OPENCODE_CONFIG_DIR)) {
    throw new Error('Path traversal detected');
  }

  if (!existsSync(OPENCODE_CONFIG_DIR)) {
    mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  }

  writeFileSync(filePath, content, 'utf-8');
}

export function downloadOpencodeConfig(name: string): { stream: NodeJS.ReadableStream; filename: string } {
  if (!name.endsWith('.json')) {
    throw new Error('Only .json config files are supported');
  }
  const allowedNames = ['opencode.json', 'config.json'];
  if (!allowedNames.includes(name)) {
    throw new Error(`Config file "${name}" is not allowed. Allowed: ${allowedNames.join(', ')}`);
  }

  const filePath = resolve(OPENCODE_CONFIG_DIR, name);
  if (!filePath.startsWith(OPENCODE_CONFIG_DIR)) {
    throw new Error('Path traversal detected');
  }

  if (!existsSync(filePath)) {
    const defaultContent = name === 'opencode.json' ? DEFAULT_OPENCODE_JSON : DEFAULT_CONFIG_JSON;
    const tmpDir = resolve(process.cwd(), 'data/tmp');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
    const tmpPath = join(tmpDir, `opencode-config-default-${Date.now()}-${name}`);
    writeFileSync(tmpPath, defaultContent, 'utf-8');
    return { stream: createReadStream(tmpPath), filename: name };
  }

  return { stream: createReadStream(filePath), filename: name };
}
