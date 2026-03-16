import { IsString, IsNumber, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateReservaDto {
    @IsString()
    @IsNotEmpty()
    propiedad_id: string;

    @IsString()
    @IsNotEmpty()
    huesped_nombre: string;

    @IsDateString()
    @IsNotEmpty()
    check_in: string;

    @IsDateString()
    @IsNotEmpty()
    check_out: string;

    @IsString()
    @IsNotEmpty()
    canal: string;

    @IsNumber()
    @IsNotEmpty()
    monto_total: number;

    @IsNumber()
    @IsOptional()
    cantidad_huespedes?: number; // ← Esta línea es la que te falta
}