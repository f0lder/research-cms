import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type ClientScopedRequest = Request & { clientId: string; userId?: string };

@Controller('public/auth')
@UseGuards(ApiKeyGuard)
export class PublicAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string },
    @Req() req: ClientScopedRequest,
  ) {
    const result = await this.authService.registerEndUser(body.email, body.password, body.name, req.clientId);
    const token = await this.jwtService.signAsync({ sub: String(result.user.id), clientId: req.clientId });
    return { user: result.user, token };
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: ClientScopedRequest,
  ) {
    const result = await this.authService.loginEndUser(body.email, body.password, req.clientId);
    const token = await this.jwtService.signAsync({ sub: String(result.user.id), clientId: req.clientId });
    return { user: result.user, token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: ClientScopedRequest) {
    return this.authService.getUserById(req.userId as string);
  }
}
