import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', env: process.env.APP_ENV || 'unknown' };
  }
}
