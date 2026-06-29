import { Injectable, OnModuleInit, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private logsService: LogsService,
  ) {}

  async onModuleInit() {
    // Drops the now-stale single-field `email` unique index and creates the
    // compound { email, clientId } one declared on the schema.
    await this.userModel.syncIndexes();
  }

  async register(email: string, password: string, name: string) {
    const existing = await this.userModel.findOne({ email, clientId: null });
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
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
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
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async registerEndUser(email: string, password: string, name: string, clientId: string) {
    const existing = await this.userModel.findOne({ email, clientId });
    if (existing) {
      this.logsService.log(`End-user registration failed — email already in use for this project`, ['auth', 'error'], { email, clientId });
      throw new ConflictException('Email already registered for this project');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
      role: UserRole.USER,
      clientId,
    });

    this.logsService.log(`New end user registered: ${name} (${email})`, ['auth', 'register'], { email, name, clientId });
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async loginEndUser(email: string, password: string, clientId: string) {
    const user = await this.userModel.findOne({ email, clientId });
    if (!user || !user.isActive) {
      this.logsService.log(`End-user login failed — unknown or inactive user`, ['auth', 'error'], { email, clientId });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logsService.log(`End-user login failed — wrong password`, ['auth', 'error'], { email, clientId });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logsService.log(`End user logged in: ${user.name} (${user.email})`, ['auth', 'login'], { email: user.email, clientId });
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateEndUser(userId: string, clientId: string) {
    const user = await this.userModel.findOne({ _id: userId, clientId, isActive: true });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async getUsers() {
    return this.userModel.find({}, { password: 0 }).populate('clientId', 'name').lean();
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id, { password: 0 }).lean();
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async adminGetUser(id: string) {
    const user = await this.userModel.findById(id, { password: 0 }).populate('clientId', 'name').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, updates: Partial<User>) {
    // Whitelist updatable fields — never trust the raw body (no password/email here).
    const allowed: (keyof User)[] = [
      'name',
      'firstName',
      'lastName',
      'displayName',
      'bio',
      'website',
      'avatarUrl',
      'role',
      'isActive',
    ];
    const sanitized: Partial<User> = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        (sanitized as Record<string, unknown>)[key] = updates[key];
      }
    }

    const user = await this.userModel.findByIdAndUpdate(id, sanitized, {
      new: true,
      projection: { password: 0 },
    });
    if (!user) throw new NotFoundException('User not found');

    this.logsService.log(`User updated: ${user.name} (${user.email})`, ['auth', 'user'], {
      email: user.email,
      fields: Object.keys(sanitized),
    });
    return user;
  }
}
