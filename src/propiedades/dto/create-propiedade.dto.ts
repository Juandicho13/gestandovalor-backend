import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreatePropiedadeDto {
  @IsOptional() @IsString() tipo_propiedad?: string;
  @IsOptional() @IsString() tipo_alojamiento?: string;
  @IsOptional() @IsString() pais?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() ciudad?: string;
  @IsOptional() @IsString() departamento?: string;

  @IsOptional() @IsNumber() capacidad_huespedes?: number;
  @IsOptional() @IsNumber() habitaciones?: number;
  @IsOptional() @IsNumber() camas?: number;
  @IsOptional() @IsNumber() banos?: number;

  @IsOptional() @IsArray() @IsString({ each: true }) comodidades?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) fotos?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) foto_categorias?: string[];

  @IsOptional() @IsString() titulo?: string;
  @IsOptional() @IsString() descripcion?: string;

  @IsOptional() @IsNumber() precio_noche?: number;

  // ✨ NUEVAS VARIABLES DE TARIFAS ✨
  @IsOptional() @IsNumber() huespedes_base?: number;
  @IsOptional() @IsNumber() precio_huesped_extra?: number;
  @IsOptional() @IsNumber() precio_mascota?: number;
  @IsOptional() @IsNumber() tarifa_aseo?: number;

  @IsOptional() descuentos?: any;
  @IsOptional() @IsArray() @IsString({ each: true }) seguridad?: string[];

  @IsOptional() @IsString() wifi_red?: string;
  @IsOptional() @IsString() wifi_pass?: string;
  @IsOptional() @IsString() cerradura_codigo?: string;

  @IsOptional() @IsString() link_airbnb?: string;
  @IsOptional() @IsString() link_booking?: string;

  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;

  @IsOptional() @IsString() propietario_id?: string;
}