import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { McpService } from './mcp.service';
import { DirectoryOperationDto, FileOperationDto, SearchOperationDto } from './dto/mcp.dto';

@ApiTags('mcp')
@Controller('mcp')
export class McpController {
    constructor(private readonly mcpService: McpService) { }

    @Get('list-dir')
    @ApiOperation({ summary: 'List contents of a directory in the repository' })
    @ApiResponse({ status: 200, description: 'Directory contents returned successfully.' })
    async listDirectory(@Query() query: DirectoryOperationDto) {
        return this.mcpService.listDirectory(query.path);
    }

    @Get('read-file')
    @ApiOperation({ summary: 'Read the contents of a file in the repository' })
    @ApiResponse({ status: 200, description: 'File contents returned successfully.' })
    async readFile(@Query() query: FileOperationDto) {
        return this.mcpService.readFile(query.path);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search for text across files in the repository using git grep' })
    @ApiResponse({ status: 200, description: 'Search results returned successfully.' })
    async search(@Query() query: SearchOperationDto) {
        return this.mcpService.searchFiles(query.query, query.path);
    }
}
