import { Module } from '@nestjs/common';
import { TareasAseoService } from './tareas-aseo.service';
import { TareasAseoController } from './tareas-aseo.controller';

@Module({
  controllers: [TareasAseoController],
  providers: [TareasAseoService],
})
export class TareasAseoModule {}
