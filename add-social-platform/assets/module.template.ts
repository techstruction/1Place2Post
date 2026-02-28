import { Module } from '@nestjs/common';
import { {{ Platform }}Service } from './{{platform}}.service';
import { {{ Platform }}Controller } from './{{platform}}.controller';

@Module({
    controllers: [{{ Platform }}Controller],
    providers: [{{ Platform }}Service],
    exports: [{{ Platform }}Service],
})
export class {{ Platform }}Module { }
