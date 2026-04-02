import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private logsService: LogsService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      this.logsService.log(`Registration failed — email already in use`, ['auth', 'error'], { email });
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await this.userModel.countDocuments();
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
      role: userCount === 0 ? UserRole.ADMIN : UserRole.EDITOR,
    });

    this.logsService.log(`New user registered: ${name} (${email})`, ['auth', 'register'], { email, name });
    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user || !user.isActive) {
      this.logsService.log(`Login failed — unknown or inactive user`, ['auth', 'error'], { email });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logsService.log(`Login failed — wrong password`, ['auth', 'error'], { email });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logsService.log(`User logged in: ${user.name} (${user.email})`, ['auth', 'login'], { email: user.email, role: user.role });
    return this.generateToken(user);
  }

  async validateUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async getUsers() {
    return this.userModel.find({}, { password: 0 }).lean();
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, projection: { password: 0 } },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private generateToken(user: UserDocument) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
