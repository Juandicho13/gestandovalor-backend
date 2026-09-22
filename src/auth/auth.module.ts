import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';

@Global()
@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '12h' },
        }),
    ],
    controllers: [AuthController],
    exports: [JwtModule],
})
export class AuthModule { }
