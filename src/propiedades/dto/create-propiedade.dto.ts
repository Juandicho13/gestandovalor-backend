import { IsOptional, IsArray, IsString, IsNumber } from 'class-validator';

export class CreatePropiedadDto {
  // ... todos tus campos anteriores ...

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foto_categorias?: string[];

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}