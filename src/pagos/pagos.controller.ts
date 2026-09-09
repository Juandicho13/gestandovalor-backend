import { Controller, Post, Body } from '@nestjs/common';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    @Post('generar-link')
    async generarLink(@Body() body: { reservaId: string; monto: number; descripcion: string }) {
        const { reservaId, monto, descripcion } = body;
        return this.pagosService.crearEnlaceDePago(reservaId, monto, descripcion);
    }
}