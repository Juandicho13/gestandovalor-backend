import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ES_PUBLICO } from './seguridad';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private jwt: JwtService,
        private reflector: Reflector,
    ) { }

    async canActivate(contexto: ExecutionContext): Promise<boolean> {
        // ¿La ruta está marcada como pública?
        const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
            contexto.getHandler(),
            contexto.getClass(),
        ]);
        if (esPublico) return true;

        const req = contexto.switchToHttp().getRequest<Request>();

        // El navegador manda: Authorization: Bearer <token>
        // Usamos cabecera y NO cookie a propósito: el frontend vive en gestandovalor.com
        // y la API en onrender.com, y Safari bloquea las cookies de terceros.
        const cabecera = req.headers.authorization || '';
        const [tipo, token] = cabecera.split(' ');

        if (tipo !== 'Bearer' || !token) {
            throw new UnauthorizedException('Falta el token de sesión');
        }

        try {
            const datos = await this.jwt.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });
            // Dejamos el usuario disponible para los controladores
            (req as any).usuario = datos;
            return true;
        } catch {
            throw new UnauthorizedException('Sesión inválida o vencida');
        }
    }
}