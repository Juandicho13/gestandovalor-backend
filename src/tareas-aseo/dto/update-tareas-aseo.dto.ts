import { PartialType } from '@nestjs/mapped-types';
import { CreateTareasAseoDto } from './create-tareas-aseo.dto';

export class UpdateTareasAseoDto extends PartialType(CreateTareasAseoDto) {}
