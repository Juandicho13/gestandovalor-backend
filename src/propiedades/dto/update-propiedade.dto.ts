import { PartialType } from '@nestjs/mapped-types';
import { CreatePropiedadeDto } from './create-propiedade.dto';

export class UpdatePropiedadeDto extends PartialType(CreatePropiedadeDto) {}
