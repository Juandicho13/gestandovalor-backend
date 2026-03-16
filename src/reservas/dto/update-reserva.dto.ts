import { PartialType } from '@nestjs/mapped-types';
import { CreatePropiedadDto } from './create-propiedad.dto';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdatePropiedadDto extends PartialType(CreatePropiedadDto) {
    @IsOptional()
    @IsNumber()
    precio_noche?: number;

    @IsOptional()
    @IsNumber()
    huespedes_base?: number;

    @IsOptional()
    @IsNumber()
    precio_huesped_extra?: number;

    @IsOptional()
    @IsNumber()
    precio_mascota?: number;

    @IsOptional()
    @IsNumber()
    tarifa_aseo?: number;
}