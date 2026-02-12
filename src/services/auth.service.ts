import { AppDataSource } from "../db/data-source";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import { CreateUserDto, UserResponseDto } from "../schema/user.schema";
import * as bcrypt from "bcrypt";
import { MoreThan } from "typeorm";
import { hashRefreshToken } from "../utils/jwt";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      select: ["id", "email", "name", "created_at", "updated_at"],
    });

    return users;
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, name } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create new user
    const user = this.userRepository.create({
      email,
      password_hash,
      name,
    });

    await this.userRepository.save(user);

    // Return user without password
    return this.toUserResponse(user);
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ["id", "email", "name", "created_at", "updated_at"],
    });

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    const refreshTokenRecord = this.refreshTokenRepository.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked_at: null,
    });

    await this.refreshTokenRepository.save(refreshTokenRecord);
  }

  async isRefreshTokenValid(refreshToken: string): Promise<boolean> {
    const tokenHash = hashRefreshToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
        expires_at: MoreThan(new Date()),
      },
    });

    return Boolean(tokenRecord);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
      },
    });

    if (!tokenRecord) {
      return;
    }

    tokenRecord.revoked_at = new Date();
    await this.refreshTokenRepository.save(tokenRecord);
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked_at: new Date() })
      .where("user_id = :userId", { userId })
      .andWhere("revoked_at IS NULL")
      .execute();
  }

  async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    return this.toUserResponse(user);
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
