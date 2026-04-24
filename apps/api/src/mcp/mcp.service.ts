import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import { statSync } from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

@Injectable()
export class McpService {
    private readonly logger = new Logger(McpService.name);

    // Assumes that apps/api is run from `apps/api` and repo root is `../..`
    private get repoRoot() {
        return path.resolve(process.cwd(), '../..');
    }

    private resolveSafePath(targetPath: string) {
        const p = targetPath || '.';
        const resolvedPath = path.resolve(this.repoRoot, p.replace(/^(\/|\\)+/, ''));
        if (!resolvedPath.startsWith(this.repoRoot)) {
            throw new BadRequestException('Access denied. Path is outside repository root.');
        }
        return resolvedPath;
    }

    async listDirectory(dirPath: string = '.') {
        try {
            const fullPath = this.resolveSafePath(dirPath);
            const items = await fs.readdir(fullPath, { withFileTypes: true });
            return items.map((item) => ({
                name: item.name,
                type: item.isDirectory() ? 'directory' : item.isFile() ? 'file' : 'other',
                size: item.isFile() ? statSync(path.join(fullPath, item.name)).size : undefined,
            }));
        } catch (error) {
            throw new BadRequestException(`Failed to read directory: ${error.message}`);
        }
    }

    async readFile(filePath: string) {
        try {
            if (!filePath) throw new Error('File path is required');
            const fullPath = this.resolveSafePath(filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            return {
                path: filePath,
                content
            };
        } catch (error) {
            throw new BadRequestException(`Failed to read file: ${error.message}`);
        }
    }

    async searchFiles(query: string, searchPath: string = '.') {
        try {
            const fullPath = this.resolveSafePath(searchPath);

            // using git grep for search within the repository root
            const { stdout } = await execPromise(`git grep -n "${query.replace(/"/g, '\\"')}"`, {
                cwd: fullPath,
            });

            const matches = stdout.split('\n').filter(line => line.length > 0);
            return {
                query,
                path: searchPath,
                matches,
            };
        } catch (error) {
            this.logger.error(`Search error: ${error.message}`);
            // git grep exits with 1 if no results found
            if (error.code === 1) {
                return {
                    query,
                    path: searchPath,
                    matches: [],
                };
            }
            throw new BadRequestException(`Search failed: ${error.message}`);
        }
    }
}
