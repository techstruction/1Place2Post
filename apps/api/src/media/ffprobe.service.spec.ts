import { FfprobeService } from './ffprobe.service';

describe('FfprobeService.parseExtension', () => {
  it('returns jpeg for .jpg files', () => {
    expect(FfprobeService.parseExtension('photo.jpg')).toBe('jpeg');
  });

  it('returns jpeg for .jpeg files', () => {
    expect(FfprobeService.parseExtension('photo.jpeg')).toBe('jpeg');
  });

  it('returns mp4 for .mp4 files', () => {
    expect(FfprobeService.parseExtension('video.mp4')).toBe('mp4');
  });

  it('returns png for .png files', () => {
    expect(FfprobeService.parseExtension('image.PNG')).toBe('png');
  });

  it('returns unknown for unrecognized extensions', () => {
    expect(FfprobeService.parseExtension('file.xyz')).toBe('unknown');
  });
});

describe('FfprobeService.computeAspectRatio', () => {
  it('computes 1:1 for square video', () => {
    expect(FfprobeService.computeAspectRatio(1080, 1080)).toBe('1:1');
  });

  it('computes 9:16 for vertical video', () => {
    expect(FfprobeService.computeAspectRatio(1080, 1920)).toBe('9:16');
  });

  it('computes 16:9 for landscape video', () => {
    expect(FfprobeService.computeAspectRatio(1920, 1080)).toBe('16:9');
  });
});
