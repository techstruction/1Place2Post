import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { FfprobeService } from './ffprobe.service';
import { MediaValidationService } from './media-validation.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, FfprobeService, MediaValidationService],
  exports: [MediaService, MediaValidationService],
})
export class MediaModule { }
