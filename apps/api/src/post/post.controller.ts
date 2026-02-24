import {
    Controller, Get, Post, Body, Patch, Param, Delete,
    UseGuards, Request,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
    constructor(private readonly postService: PostService) { }

    @Post()
    create(@Request() req, @Body() dto: CreatePostDto) {
        return this.postService.create(req.user.id, dto);
    }

    @Get()
    findAll(@Request() req) {
        return this.postService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.postService.findOne(req.user.id, id);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePostDto) {
        return this.postService.update(req.user.id, id, dto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.postService.remove(req.user.id, id);
    }
}
