import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type { DatabaseService } from './database.js';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string; // Optional for interface, required in DB
  avatar_url?: string;
  plan: 'free' | 'pro';
  plan_expires_at?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface UserSession {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export class AuthService {
  constructor(private db: DatabaseService) {}

  // Create a new user with password
  async createUser(email: string, name: string, password: string): Promise<User> {
    const userId = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password_hash: passwordHash,
      plan: 'free',
      created_at: now,
      updated_at: now,
      is_active: true
    };

    await this.db.db.prepare(`
      INSERT INTO users (id, email, name, password_hash, plan, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(user.id, user.email, user.name, user.password_hash, user.plan, user.created_at, user.updated_at, user.is_active).run();

    // Remove password_hash from returned user object for security
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.db.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = TRUE
    `).bind(email.toLowerCase().trim()).first();

    return result as User | null;
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const result = await this.db.db.prepare(`
      SELECT * FROM users WHERE id = ? AND is_active = TRUE
    `).bind(userId).first();

    return result as User | null;
  }

  // Create a session for a user
  async createSession(userId: string): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session: UserSession = {
      id: sessionId,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString()
    };

    await this.db.db.prepare(`
      INSERT INTO user_sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(session.id, session.user_id, session.expires_at, session.created_at).run();

    // Update user's last login
    await this.db.db.prepare(`
      UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?
    `).bind(now.toISOString(), now.toISOString(), userId).run();

    return session;
  }

  // Get session by token
  async getSession(sessionToken: string): Promise<UserSession | null> {
    const result = await this.db.db.prepare(`
      SELECT * FROM user_sessions 
      WHERE id = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();

    return result as UserSession | null;
  }

  // Delete session (logout)
  async deleteSession(sessionToken: string): Promise<void> {
    await this.db.db.prepare(`
      DELETE FROM user_sessions WHERE id = ?
    `).bind(sessionToken).run();
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    await this.db.db.prepare(`
      DELETE FROM user_sessions WHERE expires_at <= datetime('now')
    `).run();
  }

  // Verify password
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const result = await this.db.db.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = TRUE
    `).bind(email.toLowerCase().trim()).first();

    if (!result) return null;

    const isValid = await bcrypt.compare(password, result.password_hash);
    if (!isValid) return null;

    // Remove password_hash from returned user object
    const { password_hash, ...user } = result as any;
    return user;
  }

  // Login user with password
  async login(email: string, password: string): Promise<{ user: User; session: UserSession } | null> {
    const user = await this.verifyPassword(email, password);
    if (!user) return null;

    // Update last login
    await this.db.db.prepare(`
      UPDATE users SET last_login = ? WHERE id = ?
    `).bind(new Date().toISOString(), user.id).run();

    const session = await this.createSession(user.id);
    return { user, session };
  }

  // Register new user
  async register(email: string, name: string, password: string): Promise<{ user: User; session: UserSession }> {
    const user = await this.createUser(email, name, password);
    const session = await this.createSession(user.id);
    return { user, session };
  }

  // Legacy method - now deprecated
  async loginOrRegister(email: string, name: string): Promise<{ user: User; session: UserSession; isNewUser: boolean }> {
    let user = await this.getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      // For legacy support, create a user with a random password
      const tempPassword = uuidv4();
      user = await this.createUser(email, name, tempPassword);
      isNewUser = true;
    }

    const session = await this.createSession(user.id);
    return { user, session, isNewUser };
  }
}

// Static storage for development mode (shared across all instances)
const memoryUsers = new Map<string, User>();
const memorySessions = new Map<string, UserSession>();
const memoryEmailToUserId = new Map<string, string>();

// In-memory store for development (fallback when D1 is not available)
export class MemoryAuthService {

  async createUser(email: string, name: string, password: string): Promise<User> {
    const userId = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password_hash: passwordHash,
      plan: 'free',
      created_at: now,
      updated_at: now,
      is_active: true
    };

    memoryUsers.set(userId, user);
    memoryEmailToUserId.set(user.email, userId);

    // Remove password_hash from returned user object for security
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = memoryEmailToUserId.get(email.toLowerCase().trim());
    if (!userId) return null;
    
    const user = memoryUsers.get(userId);
    return user && user.is_active ? user : null;
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = memoryUsers.get(userId);
    return user && user.is_active ? user : null;
  }

  async createSession(userId: string): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session: UserSession = {
      id: sessionId,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString()
    };

    memorySessions.set(sessionId, session);

    // Update user's last login
    const user = memoryUsers.get(userId);
    if (user) {
      user.last_login = now.toISOString();
      user.updated_at = now.toISOString();
    }

    return session;
  }

  async getSession(sessionToken: string): Promise<UserSession | null> {
    const session = memorySessions.get(sessionToken);
    if (!session) return null;

    // Check if session is expired
    if (new Date(session.expires_at) <= new Date()) {
      memorySessions.delete(sessionToken);
      return null;
    }

    return session;
  }

  async deleteSession(sessionToken: string): Promise<void> {
    memorySessions.delete(sessionToken);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    for (const [token, session] of memorySessions.entries()) {
      if (new Date(session.expires_at) <= now) {
        memorySessions.delete(token);
      }
    }
  }

  // Verify password
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const userId = memoryEmailToUserId.get(email.toLowerCase().trim());
    if (!userId) return null;
    
    const user = memoryUsers.get(userId);
    if (!user || !user.is_active || !user.password_hash) return null;

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    // Remove password_hash from returned user object
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Login user with password
  async login(email: string, password: string): Promise<{ user: User; session: UserSession } | null> {
    const user = await this.verifyPassword(email, password);
    if (!user) return null;

    // Update last login
    const fullUser = memoryUsers.get(user.id);
    if (fullUser) {
      fullUser.last_login = new Date().toISOString();
      memoryUsers.set(user.id, fullUser);
    }

    const session = await this.createSession(user.id);
    return { user, session };
  }

  // Register new user
  async register(email: string, name: string, password: string): Promise<{ user: User; session: UserSession }> {
    const user = await this.createUser(email, name, password);
    const session = await this.createSession(user.id);
    return { user, session };
  }

  // Legacy method - now deprecated
  async loginOrRegister(email: string, name: string): Promise<{ user: User; session: UserSession; isNewUser: boolean }> {
    let user = await this.getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      // For legacy support, create a user with a random password
      const tempPassword = uuidv4();
      user = await this.createUser(email, name, tempPassword);
      isNewUser = true;
    }

    const session = await this.createSession(user.id);
    return { user, session, isNewUser };
  }
}
