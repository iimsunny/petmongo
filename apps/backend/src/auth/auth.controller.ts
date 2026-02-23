import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID, pbkdf2Sync } from 'crypto';
import { DatabaseService } from '../database/database.service';

const hashPassword = (password: string, salt: string) =>
  pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

@Controller('api/auth')
export class AuthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      phone?: string;
      email?: string;
      password?: string;
      nickname?: string;
      city?: string;
      avatarUrl?: string;
      coverUrl?: string;
      bio?: string;
      petName?: string;
      petBreed?: string;
      petGender?: string;
      petBirthday?: string;
    },
  ) {
    const phone = body.phone?.trim() || null;
    const email = body.email?.trim().toLowerCase() || null;
    const password = body.password?.trim() || '';
    const nickname = body.nickname?.trim() || '';
    const city = body.city?.trim() || null;
    const avatarUrl = body.avatarUrl?.trim() || null;
    const coverUrl = body.coverUrl?.trim() || null;
    const bio = body.bio?.trim() || null;
    const petName = body.petName?.trim() || null;
    const petBreed = body.petBreed?.trim() || null;
    const petGender = body.petGender?.trim() || null;
    const petBirthday = body.petBirthday?.trim() || null;

    if (!phone) {
      throw new BadRequestException('请提供手机号');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('密码至少 6 位');
    }

    const existing = await this.databaseService.query<{ id: string }>(
      `
        SELECT id
        FROM users
        WHERE phone = $1 OR email = $2 OR (nickname IS NOT NULL AND nickname = $3)
        LIMIT 1
      `,
      [phone, email, nickname || null],
    );
    if (existing.length > 0) {
      throw new BadRequestException('该账号已存在');
    }

    const id = randomUUID();
    const salt = randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const displayName = nickname || phone || email || '新用户';

    await this.databaseService.query(
      `
        INSERT INTO users (
          id, phone, email, password_hash, password_salt,
          nickname, avatar_url, cover_url, city, bio,
          pet_name, pet_breed, pet_gender, pet_birthday,
          created_at, updated_at, last_login_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14,
          NOW(), NOW(), NOW()
        )
      `,
      [
        id,
        phone,
        email,
        passwordHash,
        salt,
        displayName,
        avatarUrl,
        coverUrl,
        city,
        bio,
        petName,
        petBreed,
        petGender,
        petBirthday,
      ],
    );

    return {
      id,
      phone,
      email,
      nickname: displayName,
      avatarUrl,
      coverUrl,
      city,
      bio,
      petName,
      petBreed,
      petGender,
      petBirthday,
    };
  }

  @Post('login')
  async login(
    @Body()
    body: {
      identifier?: string;
      password?: string;
    },
  ) {
    const identifier = body.identifier?.trim() || '';
    const password = body.password?.trim() || '';

    if (!identifier || !password) {
      throw new BadRequestException('请输入账号与密码');
    }

    const rows = await this.databaseService.query<{
      id: string;
      phone: string | null;
      email: string | null;
      password_hash: string;
      password_salt: string;
      nickname: string | null;
      avatar_url: string | null;
      cover_url: string | null;
      city: string | null;
      bio: string | null;
      pet_name: string | null;
      pet_breed: string | null;
      pet_gender: string | null;
      pet_birthday: string | null;
    }>(
      `
        SELECT
          id,
          phone,
          email,
          password_hash,
          password_salt,
          nickname,
          avatar_url,
          cover_url,
          city,
          bio,
          pet_name,
          pet_breed,
          pet_gender,
          pet_birthday
        FROM users
        WHERE phone = $1 OR email = $1 OR nickname = $1
        LIMIT 1
      `,
      [identifier],
    );

    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const hash = hashPassword(password, user.password_salt);
    if (hash !== user.password_hash) {
      throw new UnauthorizedException('账号或密码错误');
    }

    await this.databaseService.query(
      'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id],
    );

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      coverUrl: user.cover_url,
      city: user.city,
      bio: user.bio,
      petName: user.pet_name,
      petBreed: user.pet_breed,
      petGender: user.pet_gender,
      petBirthday: user.pet_birthday,
    };
  }

  @Post('one-click')
  async oneClick(
    @Body()
    body: {
      phone?: string;
    },
  ) {
    const phone = body.phone?.trim() || '';
    if (!phone) {
      throw new BadRequestException('请提供手机号');
    }

    const rows = await this.databaseService.query<{
      id: string;
      phone: string | null;
      email: string | null;
      nickname: string | null;
      avatar_url: string | null;
      cover_url: string | null;
      city: string | null;
      bio: string | null;
      pet_name: string | null;
      pet_breed: string | null;
      pet_gender: string | null;
      pet_birthday: string | null;
    }>(
      `
        SELECT
          id,
          phone,
          email,
          nickname,
          avatar_url,
          cover_url,
          city,
          bio,
          pet_name,
          pet_breed,
          pet_gender,
          pet_birthday
        FROM users
        WHERE phone = $1
        LIMIT 1
      `,
      [phone],
    );

    const existing = rows[0];
    if (existing) {
      return {
        id: existing.id,
        phone: existing.phone,
        email: existing.email,
        nickname: existing.nickname,
        avatarUrl: existing.avatar_url,
        coverUrl: existing.cover_url,
        city: existing.city,
        bio: existing.bio,
        petName: existing.pet_name,
        petBreed: existing.pet_breed,
        petGender: existing.pet_gender,
        petBirthday: existing.pet_birthday,
      };
    }

    const id = randomUUID();
    const salt = randomBytes(16).toString('hex');
    const passwordSeed = randomBytes(12).toString('hex');
    const passwordHash = hashPassword(passwordSeed, salt);
    const displayName = phone;

    await this.databaseService.query(
      `
        INSERT INTO users (
          id, phone, email, password_hash, password_salt,
          nickname, avatar_url, cover_url, city, bio,
          pet_name, pet_breed, pet_gender, pet_birthday,
          created_at, updated_at, last_login_at
        ) VALUES (
          $1, $2, NULL, $3, $4,
          $5, NULL, NULL, NULL, NULL,
          NULL, NULL, NULL, NULL,
          NOW(), NOW(), NOW()
        )
      `,
      [id, phone, passwordHash, salt, displayName],
    );

    return {
      id,
      phone,
      email: null,
      nickname: displayName,
      avatarUrl: null,
      coverUrl: null,
      city: null,
      bio: null,
      petName: null,
      petBreed: null,
      petGender: null,
      petBirthday: null,
    };
  }
}
