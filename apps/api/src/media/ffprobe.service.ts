import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface MediaMetadata {
  type: 'image' | 'video' | 'unknown';
  format: string;
  videoCodec?: string;
  audioCodec?: string;
  widthPx?: number;
  heightPx?: number;
  durationSeconds?: number;
  sizeBytes: number;
  aspectRatio?: string;
}

const EXTENSION_MAP: Record<string, string> = {
  jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp',
  bmp: 'bmp', heic: 'heic', mp4: 'mp4', mov: 'mov', avi: 'avi',
  webm: 'webm', mkv: 'mkv',
};

@Injectable()
export class FfprobeService {
  private readonly log = new Logger(FfprobeService.name);

  static parseExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return EXTENSION_MAP[ext] ?? 'unknown';
  }

  static computeAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const d = gcd(width, height);
    return `${width / d}:${height / d}`;
  }

  async probe(filePath: string, sizeBytes: number): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);

        const videoStream = data.streams.find(s => s.codec_type === 'video');
        const audioStream = data.streams.find(s => s.codec_type === 'audio');
        const ext = FfprobeService.parseExtension(filePath);

        if (!videoStream) {
          resolve({ type: 'image', format: ext, sizeBytes });
          return;
        }

        const w = videoStream.width ?? 0;
        const h = videoStream.height ?? 0;

        resolve({
          type: 'video',
          format: ext,
          videoCodec: videoStream.codec_name,
          audioCodec: audioStream?.codec_name,
          widthPx: w,
          heightPx: h,
          durationSeconds: parseFloat(String(data.format.duration ?? '0')),
          sizeBytes,
          aspectRatio: w && h ? FfprobeService.computeAspectRatio(w, h) : undefined,
        });
      });
    });
  }
}
