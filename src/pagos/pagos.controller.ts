import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { Publico } from '../auth/seguridad';

@Controller('pagos')
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    // El huésped va a pagar: se apartan las fechas y se firma el pago
    @Publico()
    @Post('generar-link')
    async generarLink(@Body() body: any) {
        return this.pagosService.crearReservaYPago(body);
    }

    // La página de confirmación consulta el estado real del pago
    @Publico()
    @Post('verificar')
    @HttpCode(200)
    async verificar(@Body() body: { referencia: string; estado_bold?: string }) {
        return this.pagosService.verificarPago(body?.referencia, body?.estado_bold);
    }

    // Bold notifica aquí cuando un pago se aprueba o rechaza (producción)
    @Publico()
    @Post('webhook')
    @HttpCode(200)
    async webhook(
        @Req() req: any,
        @Headers('x-bold-signature') firma: string,
        @Body() body: any,
    ) {
        return this.pagosService.procesarWebhook(req.rawBody, firma, body);
    }
}