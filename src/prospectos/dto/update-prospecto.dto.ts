import { PartialType } from '@nestjs/mapped-types';
import { CreateProspectoDto } from './create-prospecto.dto';

export class UpdateProspectoDto extends PartialType(CreateProspectoDto) {}
