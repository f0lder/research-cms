import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Create a new session for a user
   */
  async createSession(userId: string, expirationDays = 7): Promise<string> {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    await this.sessionModel.create({
      sessionId,
      userId,
      expiresAt,
    });

    return sessionId;
  }

  /**
   * Validate a session and return the user ID if valid
   */
  async validateSession(sessionId: string): Promise<string | null> {
    const session = await this.sessionModel.findOne({
      sessionId,
      expiresAt: { $gt: new Date() },
    });

    if (!session) return null;
    return session.userId;
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await this.sessionModel.deleteOne({ sessionId });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
  }
}
