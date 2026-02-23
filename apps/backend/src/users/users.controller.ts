import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
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
      following_count: number;
      followers_count: number;
      likes_received_count: number;
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
          pet_birthday,
          following_count,
          followers_count,
          likes_received_count
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    const user = rows[0];
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

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
      followingCount: user.following_count,
      followersCount: user.followers_count,
      likesReceivedCount: user.likes_received_count,
    };
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      nickname?: string;
      city?: string;
      bio?: string;
      avatarUrl?: string;
      coverUrl?: string;
      petName?: string;
      petBreed?: string;
      petGender?: string;
      petBirthday?: string;
    },
  ) {
    const updates: Record<string, string | null> = {};
    if (typeof body.nickname === 'string') {
      updates.nickname = body.nickname.trim() || null;
    }
    if (typeof body.city === 'string') {
      updates.city = body.city.trim() || null;
    }
    if (typeof body.bio === 'string') {
      updates.bio = body.bio.trim() || null;
    }
    if (typeof body.avatarUrl === 'string') {
      updates.avatar_url = body.avatarUrl.trim() || null;
    }
    if (typeof body.coverUrl === 'string') {
      updates.cover_url = body.coverUrl.trim() || null;
    }
    if (typeof body.petName === 'string') {
      updates.pet_name = body.petName.trim() || null;
    }
    if (typeof body.petBreed === 'string') {
      updates.pet_breed = body.petBreed.trim() || null;
    }
    if (typeof body.petGender === 'string') {
      updates.pet_gender = body.petGender.trim() || null;
    }
    if (typeof body.petBirthday === 'string') {
      updates.pet_birthday = body.petBirthday.trim() || null;
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      throw new BadRequestException('没有可更新的字段');
    }

    const setFragments = fields.map(
      (field, index) => `${field} = $${index + 2}`,
    );
    const values = fields.map((field) => updates[field]);

    await this.databaseService.query(
      `
        UPDATE users
        SET ${setFragments.join(', ')}, updated_at = NOW()
        WHERE id = $1
      `,
      [id, ...values],
    );

    return this.getUser(id);
  }
}
