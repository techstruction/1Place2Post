import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileOperationDto {
    @ApiProperty({
        description: 'File path relative to the repository root',
        example: 'apps/web/package.json',
    })
    @IsString()
    path: string;
}

export class DirectoryOperationDto {
    @ApiPropertyOptional({
        description:
            'Directory path relative to the repository root. Omit to list the root.',
        example: 'apps/web',
    })
    @IsOptional()
    @IsString()
    path?: string;
}

export class SearchOperationDto {
    @ApiProperty({
        description:
            'Text to search for across repository files (uses git grep)',
        example: 'NestFactory.create',
    })
    @IsString()
    query: string;

    @ApiPropertyOptional({
        description:
            'Directory path relative to the repository root to scope the search. Omit to search entire repo.',
        example: 'apps',
    })
    @IsOptional()
    @IsString()
    path?: string;
}
