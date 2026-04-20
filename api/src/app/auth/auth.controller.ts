import { Controller, Post, Body, UseGuards, Get, Patch, Param, Request, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { SessionGuard } from './guards/session.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
  ) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string },
    @Response() res,
  ) {
    const result = await this.authService.register(body.email, body.password, body.name);
    if ('error' in result) {
      return res.status(400).json(result);
    }

    // Create session
    const sessionId = await this.sessionService.createSession(result.user.id.toString());
    res.cookie('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({ user: result.user });
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Response() res,
  ) {
    const result = await this.authService.login(body.email, body.password);
    if ('error' in result) {
      return res.status(401).json(result);
    }

    // Create session
    const sessionId = await this.sessionService.createSession(result.user.id.toString());
    res.cookie('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({ user: result.user });
  }

  @UseGuards(SessionGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.authService.getUserById(req.userId);
    return user;
  }

  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  getUsers() {
    return this.authService.getUsers();
  }

  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id')
  updateUserRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    return this.authService.updateUserRole(id, body.role);
  }

  @Post('logout')
  logout(@Request() req, @Response() res) {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      this.sessionService.invalidateSession(sessionId).catch(console.error);
    }
    res.clearCookie('session');
    return res.json({ success: true });
  }
}

