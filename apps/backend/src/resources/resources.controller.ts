import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type MediaRow = {
  id: string;
  type: string;
  url: string;
  thumbUrl: string | null;
  sortOrder: number;
};

type UnifiedResourceRow = {
  id: string;
  name: string;
  category: string;
  city: string;
  cover_url: string | null;
  location_hint: string | null;
  safety_note: string | null;
  best_time: string | null;
  verified: boolean;
  tags: string[];
  media: MediaRow[];
  created_at: string;
};

type PendingResourceReviewRow = {
  id: string;
  name: string;
  category: string;
  city: string;
  cover_url: string | null;
  location_hint: string | null;
  safety_note: string | null;
  best_time: string | null;
  created_at: string;
  submitter_id: string | null;
};

@Controller('api/resources')
export class ResourcesController {
  constructor(private readonly databaseService: DatabaseService) {}

  private async tableExists(tableName: string): Promise<boolean> {
    const rows = await this.databaseService.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = $1
        ) AS exists
      `,
      [tableName],
    );

    return Boolean(rows[0]?.exists);
  }

  private async columnExists(tableName: string, columnName: string): Promise<boolean> {
    const rows = await this.databaseService.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = $2
        ) AS exists
      `,
      [tableName, columnName],
    );

    return Boolean(rows[0]?.exists);
  }

  private async ensureAdminUser(userId?: string): Promise<void> {
    if (!userId) {
      throw new BadRequestException('reviewerId is required');
    }

    const hasAdminUsers = await this.tableExists('admin_users');
    if (!hasAdminUsers) {
      throw new ForbiddenException('admin_users table not found');
    }

    const rows = await this.databaseService.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM admin_users
          WHERE user_id = $1
        ) AS exists
      `,
      [userId],
    );

    if (!rows[0]?.exists) {
      throw new ForbiddenException('Current user is not admin');
    }
  }

  private async listFromResources(city?: string, category?: string): Promise<UnifiedResourceRow[]> {
    const hasResources = await this.tableExists('resources');
    if (!hasResources) {
      return [];
    }

    const [
      hasStatus,
      hasCoverUrl,
      hasLocationHint,
      hasSafetyNote,
      hasBestTime,
      hasVerified,
      hasCreatedAt,
      hasResourceTags,
      hasTags,
      hasMediaAssets,
    ] = await Promise.all([
      this.columnExists('resources', 'status'),
      this.columnExists('resources', 'cover_url'),
      this.columnExists('resources', 'location_hint'),
      this.columnExists('resources', 'safety_note'),
      this.columnExists('resources', 'best_time'),
      this.columnExists('resources', 'verified'),
      this.columnExists('resources', 'created_at'),
      this.tableExists('resource_tags'),
      this.tableExists('tags'),
      this.tableExists('media_assets'),
    ]);

    const statusFilter = hasStatus ? `AND r.status = 'approved'` : '';
    const coverExpr = hasCoverUrl ? 'r.cover_url' : 'NULL::text';
    const locationHintExpr = hasLocationHint ? 'r.location_hint' : 'NULL::text';
    const safetyExpr = hasSafetyNote ? 'r.safety_note' : 'NULL::text';
    const bestTimeExpr = hasBestTime ? 'r.best_time' : 'NULL::text';
    const verifiedExpr = hasVerified ? 'r.verified' : 'FALSE';
    const createdAtExpr = hasCreatedAt ? 'r.created_at' : 'NOW()';
    const orderByExpr = hasCreatedAt ? 'r.created_at DESC' : 'r.id DESC';

    const canJoinTags = hasResourceTags && hasTags;
    const tagsSelectExpr = canJoinTags
      ? `COALESCE(array_remove(array_agg(DISTINCT t.name), NULL), '{}')`
      : `'{}'::text[]`;
    const tagsJoin = canJoinTags
      ? `
        LEFT JOIN resource_tags rt ON rt.resource_id = r.id
        LEFT JOIN tags t ON t.id = rt.tag_id
      `
      : '';

    const mediaSelectExpr = hasMediaAssets
      ? `
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', m.id,
              'type', m.type,
              'url', m.url,
              'thumbUrl', m.thumb_url,
              'sortOrder', m.sort_order
            )
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'::json
        )
      `
      : `'[]'::json`;
    const mediaJoin = hasMediaAssets
      ? `LEFT JOIN media_assets m ON m.resource_id = r.id`
      : '';

    return this.databaseService.query<UnifiedResourceRow>(
      `
        SELECT
          r.id,
          r.name,
          c.name AS category,
          ci.name AS city,
          ${coverExpr} AS cover_url,
          ${locationHintExpr} AS location_hint,
          ${safetyExpr} AS safety_note,
          ${bestTimeExpr} AS best_time,
          ${verifiedExpr} AS verified,
          ${tagsSelectExpr} AS tags,
          ${mediaSelectExpr} AS media,
          ${createdAtExpr} AS created_at
        FROM resources r
        JOIN categories c ON r.category_id = c.id
        JOIN cities ci ON r.city_id = ci.id
        ${tagsJoin}
        ${mediaJoin}
        WHERE ($1::text IS NULL OR ci.name = $1)
          AND ($2::text IS NULL OR c.name = $2)
          ${statusFilter}
        GROUP BY r.id, c.name, ci.name
        ORDER BY ${orderByExpr}
      `,
      [city || null, category || null],
    );
  }

  private async listFromPlaces(city?: string, category?: string): Promise<UnifiedResourceRow[]> {
    const hasPlaces = await this.tableExists('places');
    if (!hasPlaces) {
      return [];
    }

    const [hasDescription, hasAddress, hasLocationHint, hasCreatedAt, hasCoverUrl, hasPlaceMedia] = await Promise.all([
      this.columnExists('places', 'description'),
      this.columnExists('places', 'address'),
      this.columnExists('places', 'location_hint'),
      this.columnExists('places', 'created_at'),
      this.columnExists('places', 'cover_url'),
      this.tableExists('place_media'),
    ]);

    const locationHintExpr = hasLocationHint
      ? hasAddress
        ? 'COALESCE(p.location_hint, p.address)'
        : 'p.location_hint'
      : hasAddress
      ? 'p.address'
      : 'NULL::text';

    const safetyExpr = hasDescription
      ? 'p.description'
      : hasAddress
      ? 'p.address'
      : 'NULL::text';

    const createdAtExpr = hasCreatedAt ? 'p.created_at' : 'NOW()';
    const orderByExpr = hasCreatedAt ? 'p.created_at DESC' : 'p.id DESC';
    const coverExpr = hasCoverUrl ? 'p.cover_url' : 'NULL::text';
    const mediaExpr = hasPlaceMedia
      ? `
        COALESCE(
          (
            SELECT json_agg(
              jsonb_build_object(
                'id', pm.id,
                'type', pm.type,
                'url', pm.url,
                'thumbUrl', pm.thumb_url,
                'sortOrder', pm.sort_order
              )
              ORDER BY pm.sort_order, pm.created_at
            )
            FROM place_media pm
            WHERE pm.place_id = p.id
          ),
          '[]'::json
        )
      `
      : hasCoverUrl
      ? `
        CASE
          WHEN p.cover_url IS NULL THEN '[]'::json
          ELSE json_build_array(
            json_build_object(
              'id', p.id::text || '-cover',
              'type', 'image',
              'url', p.cover_url,
              'thumbUrl', NULL,
              'sortOrder', 1
            )
          )::json
        END
      `
      : `'[]'::json`;

    return this.databaseService.query<UnifiedResourceRow>(
      `
        SELECT
          p.id,
          p.name,
          c.name AS category,
          ci.name AS city,
          ${coverExpr} AS cover_url,
          ${locationHintExpr} AS location_hint,
          ${safetyExpr} AS safety_note,
          NULL::text AS best_time,
          TRUE AS verified,
          '{}'::text[] AS tags,
          ${mediaExpr} AS media,
          ${createdAtExpr} AS created_at
        FROM places p
        JOIN categories c ON p.category_id = c.id
        JOIN cities ci ON p.city_id = ci.id
        WHERE ($1::text IS NULL OR ci.name = $1)
          AND ($2::text IS NULL OR c.name = $2)
        ORDER BY ${orderByExpr}
      `,
      [city || null, category || null],
    );
  }

  @Get()
  async listResources(
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    const [resourceRows, placeRows] = await Promise.all([
      this.listFromResources(city, category),
      this.listFromPlaces(city, category),
    ]);

    const mergedById = new Map<string, UnifiedResourceRow>();
    [...resourceRows, ...placeRows].forEach((row) => {
      if (!mergedById.has(row.id)) {
        mergedById.set(row.id, row);
      }
    });

    const rows = Array.from(mergedById.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return rows.map((row) => {
      const mediaList = row.media || [];
      const normalizedMedia =
        mediaList.length > 0
          ? mediaList
          : row.cover_url
          ? [
              {
                id: `${row.id}-cover`,
                type: 'image',
                url: row.cover_url,
                thumbUrl: null,
                sortOrder: 1,
              },
            ]
          : [];

      return {
        id: row.id,
        title: row.name,
        category: row.category,
        city: row.city,
        tags: row.tags || [],
        safety: row.safety_note,
        bestTime: row.best_time,
        locationHint: row.location_hint,
        verified: row.verified,
        coverUrl: row.cover_url,
        media: normalizedMedia,
      };
    });
  }

  @Post()
  async createResource(
    @Body()
    body: {
      name: string;
      category: string;
      city: string;
      locationHint?: string;
      safetyNote?: string;
      bestTime?: string;
      coverUrl?: string;
      submitterId?: string;
    },
  ) {
    const { name, category, city, locationHint, safetyNote, bestTime, coverUrl, submitterId } = body;

    if (!name || !category || !city) {
      throw new Error('Missing required fields: name, category, city');
    }

    const [hasResources, hasPlaces, hasSubmissions] = await Promise.all([
      this.tableExists('resources'),
      this.tableExists('places'),
      this.tableExists('submissions'),
    ]);

    if (!hasResources && !hasPlaces) {
      throw new Error('Neither resources nor places table exists');
    }

    let cityRow = await this.databaseService.query<{ id: string }>(
      `SELECT id FROM cities WHERE name = $1 LIMIT 1`,
      [city],
    );

    if (cityRow.length === 0) {
      cityRow = await this.databaseService.query<{ id: string }>(
        `INSERT INTO cities (id, name) VALUES (gen_random_uuid(), $1) RETURNING id`,
        [city],
      );
    }

    const categoryRow = await this.databaseService.query<{ id: string }>(
      `SELECT id FROM categories WHERE name = $1 LIMIT 1`,
      [category],
    );

    if (categoryRow.length === 0) {
      throw new Error(`Category "${category}" not found`);
    }

    if (hasResources) {
      const resourceResult = await this.databaseService.query<{ id: string }>(
        `
          INSERT INTO resources (
            id,
            name,
            category_id,
            city_id,
            cover_url,
            location_hint,
            safety_note,
            best_time,
            status
          )
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'pending'
          )
          RETURNING id
        `,
        [
          name,
          categoryRow[0].id,
          cityRow[0].id,
          coverUrl || null,
          locationHint || null,
          safetyNote || null,
          bestTime || null,
        ],
      );

      const resourceId = resourceResult[0].id;

      if (submitterId && hasSubmissions) {
        await this.databaseService.query(
          `
            INSERT INTO submissions (
              id,
              resource_id,
              submitter_id,
              payload,
              status
            )
            VALUES (
              gen_random_uuid(),
              $1,
              $2,
              $3::jsonb,
              'pending'
            )
          `,
          [
            resourceId,
            submitterId,
            JSON.stringify({
              name,
              category,
              city,
              locationHint,
              safetyNote,
              bestTime,
              coverUrl,
            }),
          ],
        );
      }

      return {
        id: resourceId,
        message: 'Resource submitted successfully, pending review',
      };
    }

    const [hasDescription, hasAddress, hasLocationHint, hasCoverUrl] = await Promise.all([
      this.columnExists('places', 'description'),
      this.columnExists('places', 'address'),
      this.columnExists('places', 'location_hint'),
      this.columnExists('places', 'cover_url'),
    ]);

    const columns = ['id', 'name', 'category_id', 'city_id'];
    const values = ['gen_random_uuid()', '$1', '$2', '$3'];
    const params: Array<string | null> = [name, categoryRow[0].id, cityRow[0].id];

    if (hasLocationHint) {
      columns.push('location_hint');
      params.push(locationHint || null);
      values.push(`$${params.length}`);
    }

    if (hasDescription) {
      columns.push('description');
      params.push(safetyNote || null);
      values.push(`$${params.length}`);
    }

    if (hasAddress) {
      columns.push('address');
      params.push(locationHint || null);
      values.push(`$${params.length}`);
    }

    if (hasCoverUrl) {
      columns.push('cover_url');
      params.push(coverUrl || null);
      values.push(`$${params.length}`);
    }

    const placeResult = await this.databaseService.query<{ id: string }>(
      `
        INSERT INTO places (${columns.join(', ')})
        VALUES (${values.join(', ')})
        RETURNING id
      `,
      params,
    );

    return {
      id: placeResult[0].id,
      message: 'Place created successfully',
    };
  }

  @Get('reviews/pending')
  async listPendingResourceReviews(
    @Query('limit') limit?: string,
    @Query('reviewerId') reviewerId?: string,
  ) {
    await this.ensureAdminUser(reviewerId);

    const hasResources = await this.tableExists('resources');
    if (!hasResources) {
      return [];
    }

    const [
      hasStatus,
      hasCoverUrl,
      hasLocationHint,
      hasSafetyNote,
      hasBestTime,
      hasCreatedAt,
      hasSubmissions,
      hasSubmitterId,
      hasSubmissionCreatedAt,
    ] = await Promise.all([
      this.columnExists('resources', 'status'),
      this.columnExists('resources', 'cover_url'),
      this.columnExists('resources', 'location_hint'),
      this.columnExists('resources', 'safety_note'),
      this.columnExists('resources', 'best_time'),
      this.columnExists('resources', 'created_at'),
      this.tableExists('submissions'),
      this.columnExists('submissions', 'submitter_id'),
      this.columnExists('submissions', 'created_at'),
    ]);

    if (!hasStatus) {
      return [];
    }

    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(100, Math.floor(parsedLimit)))
      : 50;

    const coverExpr = hasCoverUrl ? 'r.cover_url' : 'NULL::text';
    const locationHintExpr = hasLocationHint ? 'r.location_hint' : 'NULL::text';
    const safetyExpr = hasSafetyNote ? 'r.safety_note' : 'NULL::text';
    const bestTimeExpr = hasBestTime ? 'r.best_time' : 'NULL::text';
    const createdExpr = hasCreatedAt ? 'r.created_at' : 'NOW()';
    const orderExpr = hasCreatedAt ? 'r.created_at DESC' : 'r.id DESC';
    const submitterExpr = hasSubmissions && hasSubmitterId ? 's.submitter_id' : 'NULL::text';
    const submissionOrderExpr =
      hasSubmissions && hasSubmissionCreatedAt ? 's.created_at DESC' : 's.id DESC';
    const submissionSelectExpr = hasSubmitterId ? 's.submitter_id' : 'NULL::text AS submitter_id';
    const submissionJoin =
      hasSubmissions
        ? `
        LEFT JOIN LATERAL (
          SELECT ${submissionSelectExpr}
          FROM submissions s
          WHERE s.resource_id = r.id
          ORDER BY ${submissionOrderExpr}
          LIMIT 1
        ) s ON TRUE
      `
        : '';

    const rows = await this.databaseService.query<PendingResourceReviewRow>(
      `
        SELECT
          r.id,
          r.name,
          c.name AS category,
          ci.name AS city,
          ${coverExpr} AS cover_url,
          ${locationHintExpr} AS location_hint,
          ${safetyExpr} AS safety_note,
          ${bestTimeExpr} AS best_time,
          ${createdExpr} AS created_at,
          ${submitterExpr} AS submitter_id
        FROM resources r
        JOIN categories c ON r.category_id = c.id
        JOIN cities ci ON r.city_id = ci.id
        ${submissionJoin}
        WHERE r.status = 'pending'
        ORDER BY ${orderExpr}
        LIMIT $1
      `,
      [safeLimit],
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.name,
      category: row.category,
      city: row.city,
      coverUrl: row.cover_url,
      locationHint: row.location_hint,
      safety: row.safety_note,
      bestTime: row.best_time,
      submitterId: row.submitter_id,
      createdAt: row.created_at,
    }));
  }

  @Patch('reviews/:resourceId')
  async reviewResource(
    @Param('resourceId') resourceId: string,
    @Body()
    body: {
      action: 'approve' | 'reject';
      reviewerId?: string;
      reviewNote?: string;
    },
  ) {
    await this.ensureAdminUser(body?.reviewerId);

    const nextStatus =
      body?.action === 'approve'
        ? 'approved'
        : body?.action === 'reject'
        ? 'rejected'
        : null;

    if (!nextStatus) {
      throw new Error('Invalid action. Use approve or reject.');
    }

    const hasResources = await this.tableExists('resources');
    if (!hasResources) {
      throw new Error('resources table not found');
    }

    const [hasStatus, hasUpdatedAt, hasSubmissions] = await Promise.all([
      this.columnExists('resources', 'status'),
      this.columnExists('resources', 'updated_at'),
      this.tableExists('submissions'),
    ]);

    if (!hasStatus) {
      throw new Error('resources.status column not found');
    }

    const resourceSetClauses = ['status = $1'];
    const resourceParams: unknown[] = [nextStatus];
    if (hasUpdatedAt) {
      resourceSetClauses.push('updated_at = NOW()');
    }
    resourceParams.push(resourceId);

    const updatedRows = await this.databaseService.query<{ id: string }>(
      `
        UPDATE resources
        SET ${resourceSetClauses.join(', ')}
        WHERE id = $${resourceParams.length}
          AND status = 'pending'
        RETURNING id
      `,
      resourceParams,
    );

    if (updatedRows.length === 0) {
      throw new Error('Pending resource not found or already reviewed');
    }

    if (hasSubmissions) {
      const [hasSubStatus, hasReviewedAt, hasReviewerId, hasReviewNote] = await Promise.all([
        this.columnExists('submissions', 'status'),
        this.columnExists('submissions', 'reviewed_at'),
        this.columnExists('submissions', 'reviewer_id'),
        this.columnExists('submissions', 'review_note'),
      ]);

      const submissionSetClauses: string[] = [];
      const submissionParams: unknown[] = [];

      if (hasSubStatus) {
        submissionParams.push(nextStatus);
        submissionSetClauses.push(`status = $${submissionParams.length}`);
      }
      if (hasReviewedAt) {
        submissionSetClauses.push('reviewed_at = NOW()');
      }
      if (hasReviewerId && body.reviewerId) {
        submissionParams.push(body.reviewerId);
        submissionSetClauses.push(`reviewer_id = $${submissionParams.length}`);
      }
      if (hasReviewNote && body.reviewNote) {
        submissionParams.push(body.reviewNote);
        submissionSetClauses.push(`review_note = $${submissionParams.length}`);
      }

      if (submissionSetClauses.length > 0) {
        submissionParams.push(resourceId);
        const whereClauses = [`resource_id = $${submissionParams.length}`];
        if (hasSubStatus) {
          whereClauses.push(`status = 'pending'`);
        }
        await this.databaseService.query(
          `
            UPDATE submissions
            SET ${submissionSetClauses.join(', ')}
            WHERE ${whereClauses.join(' AND ')}
          `,
          submissionParams,
        );
      }
    }

    return {
      ok: true,
      id: resourceId,
      status: nextStatus,
    };
  }
}
