import { join, basename, extname, dirname } from 'path';
import { existsSync, mkdirSync, readdirSync, lstatSync, unlinkSync } from 'fs';
import { rm, copyFile, rename, writeFile } from 'fs/promises';
import { execSync } from 'child_process';

function expandHome(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return join(process.env.HOME || '/root', filePath.slice(2));
  }
  return filePath;
}

export function getSkillsPath(): string {
  const rawPath = process.env.VITE_OPENCODE_SKILLS_PATH || '~/.config/opencode/skills';
  return expandHome(rawPath);
}

export function getAgentsSkillsPath(): string {
  return join(process.env.HOME || '/root', '.agents/skills');
}

export function getTempPath(): string {
  return process.env.VITE_BACKEND_TEMPORARY_PATH || '/tmp';
}

export function resolveSkillPath(name: string): string | null {
  const primary = join(getSkillsPath(), name);
  if (existsSync(primary)) return primary;
  const agents = join(getAgentsSkillsPath(), name);
  if (existsSync(agents)) return agents;
  return null;
}

export async function ensureSkillsDir(): Promise<string> {
  const skillsDir = getSkillsPath();
  if (!existsSync(skillsDir)) {
    mkdirSync(skillsDir, { recursive: true });
  }
  return skillsDir;
}

/**
 * Extract a skill package (.tar.gz/.zip) and deploy to the skills directory.
 * Archive must contain either a single top-level dir with SKILL.md, or SKILL.md at root (auto-wrapped by filename).
 * Replaces existing skill with the same name. Cross-device moves fall back to copy+remove.
 */
export async function deploySkillPackage(
  sourceBuffer: Buffer,
  filename: string,
): Promise<{ skillName: string; skillPath: string }> {
  const tempDir = getTempPath();
  const skillsDir = await ensureSkillsDir();

  const stagingDir = join(tempDir, `skill-upload-${Date.now()}`);
  mkdirSync(stagingDir, { recursive: true });

  const uploadedPath = join(stagingDir, filename);
  await writeFile(uploadedPath, sourceBuffer);

  const extractDir = join(stagingDir, 'extracted');
  mkdirSync(extractDir, { recursive: true });

  const ext = extname(filename).toLowerCase();
  const isTarGz = filename.endsWith('.tar.gz') || filename.endsWith('.tgz') || ext === '.gz';
  const isZip = ext === '.zip';

  try {
    if (isTarGz) {
      execSync(`tar -xzf "${uploadedPath}" -C "${extractDir}"`, { cwd: extractDir });
    } else if (isZip) {
      execSync(`unzip -o -q "${uploadedPath}" -d "${extractDir}"`, { cwd: extractDir });
    } else {
      throw new Error(`Unsupported archive format: ${ext}. Only .tar.gz and .zip are supported.`);
    }
  } catch (err: any) {
    await cleanup(stagingDir);
    throw new Error(`Failed to extract archive: ${err.message}`);
  }

  const entries = readdirSync(extractDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory());

  let skillDirName: string | null = null;
  let skillDirPath: string | null = null;

  if (dirs.length === 1) {
    const dirName = dirs[0].name;
    const dirPath = join(extractDir, dirName);
    if (existsSync(join(dirPath, 'SKILL.md'))) {
      skillDirName = dirName;
      skillDirPath = dirPath;
    }
  }

  if (!skillDirName || !skillDirPath) {
    if (existsSync(join(extractDir, 'SKILL.md'))) {
      skillDirName = basename(filename, isTarGz ? '.tar.gz' : '.zip');
      if (skillDirName.endsWith('.tar')) skillDirName = basename(skillDirName, '.tar');
      if (skillDirName.endsWith('.tgz')) skillDirName = basename(skillDirName, '.tgz');
      const wrappedDir = join(extractDir, skillDirName);
      mkdirSync(wrappedDir, { recursive: true });
      const allEntries = readdirSync(extractDir, { withFileTypes: true });
      for (const entry of allEntries) {
        if (entry.name === skillDirName) continue;
        const src = join(extractDir, entry.name);
        const dst = join(wrappedDir, entry.name);
        await rename(src, dst);
      }
      skillDirPath = wrappedDir;
    }
  }

  if (!skillDirName || !skillDirPath) {
    await cleanup(stagingDir);
    throw new Error('Invalid skill package: archive must contain a directory with SKILL.md');
  }

  const targetPath = join(skillsDir, skillDirName);
  if (existsSync(targetPath)) {
    await rm(targetPath, { recursive: true });
  }

  try {
    await rename(skillDirPath, targetPath);
  } catch {
    await copyDirRecursive(skillDirPath, targetPath);
    await rm(skillDirPath, { recursive: true });
  }

  await cleanup(stagingDir);

  return { skillName: skillDirName, skillPath: targetPath };
}

/**
 * Pack a skill directory into a .tar.gz archive in a temp location.
 * Resolves symlinks via `tar -h` so the archive is self-contained.
 * Returns the path to the created archive. Caller is responsible for cleanup.
 */
export function packSkillDirectory(skillDirPath: string): string {
  if (!existsSync(skillDirPath)) {
    throw new Error(`Skill directory not found: ${skillDirPath}`);
  }
  const skillName = basename(skillDirPath);
  const parentDir = dirname(skillDirPath);
  const archivePath = join(getTempPath(), `${skillName}.tar.gz`);
  execSync(`tar -h -czf "${archivePath}" -C "${parentDir}" "${skillName}"`, { cwd: parentDir });
  return archivePath;
}

export async function removeSkill(skillDirPath: string): Promise<{ wasSymlink: boolean }> {
  let stat;
  try {
    stat = lstatSync(skillDirPath);
  } catch {
    throw new Error(`Skill path not found: ${skillDirPath}`);
  }
  if (stat.isSymbolicLink()) {
    unlinkSync(skillDirPath);
    return { wasSymlink: true };
  }
  if (stat.isDirectory()) {
    await rm(skillDirPath, { recursive: true });
    return { wasSymlink: false };
  }
  throw new Error(`Skill path is neither a directory nor a symlink: ${skillDirPath}`);
}

async function copyDirRecursive(src: string, dest: string): Promise<void> {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function cleanup(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true });
  } catch { /* best-effort */ }
}
