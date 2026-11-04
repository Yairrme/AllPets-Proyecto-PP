import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Patch,
  Header,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Logger,
  NotFoundException,
  StreamableFile,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
  Delete,
} from '@nestjs/common';
import {
  CaregiverFileField,
  CreateReviewDto,
  MARKET_PATTERNS,
  PaginationDto,
  ReviewIdParamDto,
  UpdateCaregiverProfileDto,
  UpdateReviewDto,
  UpdateUserDto,
  UserRole,
} from 'y/contracts';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { createReadStream, existsSync } from 'fs';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import type { AuthenticatedRequest } from './auth/auth.types';
import { OwnerOrAdminGuard } from './auth/owner-or-admin.guard';
import { UserSessionService } from './auth/user-session.service';
import { MarketClient } from './market/market.client';
import {
  assertSavedFilename,
  certificationFile,
  certificationUploadOptions,
  imageUploadOptions as multerOptions,
  removeCertificationFile,
  removeUploads,
  removeUserCertifications,
} from './uploads/upload-options';
import { UserClient } from './user.client';

/** Límite para endpoints de subida: 10 peticiones por minuto por IP */
const UPLOAD_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly users: UserClient,
    private readonly market: MarketClient,
    private readonly userSessions: UserSessionService,
  ) {}

  @Get('users/:id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Usuario no encontrado o ID inválido',
  })
  @ApiResponse({ status: 403, description: 'Solo puedes ver tu propio perfil' })
  getUserById(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    // Evita que un usuario consulte email/teléfono de otros usuarios
    this.assertCanManageUser(id, request);
    return this.users.send('get_user_by_id', id, 'Error al obtener usuario');
  }

  @Put('users/:id')
  @ApiOperation({
    summary:
      'Actualizar datos personales del usuario (nombre, email, ciudad, teléfono)',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario a actualizar' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({
    status: 403,
    description: 'Solo puedes modificar tu propio perfil',
  })
  updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertCanManageUser(id, request);
    return this.users.send(
      'update_user',
      { user_id: id, updateData },
      'Error al actualizar los datos del usuario',
    );
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a eliminar' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado (Requiere rol ADMIN)',
  })
  async deleteUser(@Param('id') id: string) {
    const { files, ...result } = await this.users.send<{
      message: string;
      user_id: string;
      files: string[];
    }>('delete_user', id, 'Error al eliminar usuario');

    this.userSessions.forget(id);
    // La cuenta ya no existe: si falla la limpieza se registra, no se revierte.
    await Promise.all([
      this.market
        .send(MARKET_PATTERNS.CART_DELETE, { userId: id })
        .catch((error: unknown) =>
          this.logger.error(
            `No se pudo borrar el carrito de ${id}: ${String(error)}`,
          ),
        ),
      Promise.all([removeUploads(files), removeUserCertifications(id)]).catch(
        (error: unknown) =>
          this.logger.error(
            `No se pudieron borrar los archivos de ${id}: ${String(error)}`,
          ),
      ),
    ]);
    return result;
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los usuarios (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Listado de usuarios' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado (Requiere rol ADMIN)',
  })
  getAllUsers(@Query() pagination: PaginationDto) {
    return this.users.send(
      'get_all_users',
      pagination,
      'Error al obtener usuarios',
    );
  }

  @Get('users/:userId/caregiver-profile')
  @UseGuards(OwnerOrAdminGuard)
  @ApiOperation({
    summary: 'Obtener el perfil completo, con comprobantes (dueño o admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 403, description: 'Solo el dueño o un admin' })
  getCaregiverProfile(@Param('userId') userId: string) {
    return this.users.send(
      'get_caregiver_profile',
      { user_id: userId },
      'Error al obtener el perfil del cuidador',
    );
  }

  @Put('users/:userId/caregiver-profile')
  @Roles(UserRole.WALKER, UserRole.CAREGIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar perfil de cuidador/paseador' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador a actualizar' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({
    status: 403,
    description: 'Solo puedes modificar tu propio perfil',
  })
  updateCaregiverProfile(
    @Param('userId') userId: string,
    @Body() updateData: UpdateCaregiverProfileDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertCanManageUser(userId, request);
    return this.users.send(
      'update_caregiver_profile',
      { user_id: userId, updateData },
      'Error al actualizar el perfil del cuidador',
    );
  }

  @Post('users/:userId/image')
  @ApiOperation({ summary: 'Subir avatar de perfil de usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (JPG, PNG, etc.)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Foto de perfil subida exitosamente',
  })
  @Throttle(UPLOAD_THROTTLE)
  @UseGuards(OwnerOrAdminGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadUserImage(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    const imageUrl = `/uploads/${file.filename}`;
    return this.keepFilesOnlyIfSaved([imageUrl], () =>
      this.users.send(
        'update_user_profile_image',
        { user_id: userId, profile_image: imageUrl },
        'Error al guardar la imagen de perfil del usuario',
      ),
    );
  }

  @Post('users/:userId/caregiver-profile/image')
  @Roles(UserRole.WALKER, UserRole.CAREGIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Subir foto de perfil profesional de cuidador' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen profesional',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Foto profesional subida' })
  @Throttle(UPLOAD_THROTTLE)
  @UseGuards(OwnerOrAdminGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadProfileImage(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    const imageUrl = `/uploads/${file.filename}`;
    return this.keepFilesOnlyIfSaved([imageUrl], () =>
      this.users.send(
        'update_caregiver_profile_image',
        { user_id: userId, profile_image: imageUrl },
        'Error al guardar la imagen de perfil',
      ),
    );
  }

  @Post('users/:userId/caregiver-profile/gallery')
  @Roles(UserRole.WALKER, UserRole.CAREGIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Subir imágenes a la galería (hasta 10 fotos)' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Múltiples fotos de galería',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imágenes agregadas a la galería' })
  @ApiResponse({ status: 409, description: 'Se superaría el máximo de fotos' })
  @Throttle(UPLOAD_THROTTLE)
  @UseGuards(OwnerOrAdminGuard)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadGalleryImages(
    @Param('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0)
      throw new BadRequestException('No se han subido archivos');

    const paths = files.map((f) => `/uploads/${f.filename}`);
    return this.keepFilesOnlyIfSaved(paths, () =>
      this.addFiles(
        userId,
        'gallery_images',
        paths,
        'Error al guardar imágenes en la galería',
      ),
    );
  }

  @Delete('users/:userId/caregiver-profile/gallery/:filename')
  @Roles(UserRole.WALKER, UserRole.CAREGIVER, UserRole.ADMIN)
  @UseGuards(OwnerOrAdminGuard)
  @ApiOperation({ summary: 'Eliminar una foto de la galería' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiParam({ name: 'filename', description: 'Nombre del archivo' })
  @ApiResponse({ status: 200, description: 'Foto eliminada' })
  @ApiResponse({ status: 404, description: 'La foto no es de este perfil' })
  async removeGalleryImage(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
  ) {
    assertSavedFilename(filename);
    const path = `/uploads/${filename}`;
    const profile = await this.removeFile(
      userId,
      'gallery_images',
      path,
      'Error al eliminar la foto',
    );
    await removeUploads([path]);
    return profile;
  }

  @Post('users/:userId/caregiver-profile/certifications')
  @Roles(UserRole.WALKER, UserRole.CAREGIVER, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Subir comprobantes de certificaciones o permisos municipales (hasta 10 archivos)',
  })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Fotos o comprobantes de certificaciones/permisos municipales',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Comprobantes de certificación agregados al perfil',
  })
  @ApiResponse({
    status: 409,
    description: 'Se superaría el máximo de comprobantes',
  })
  @Throttle(UPLOAD_THROTTLE)
  @UseGuards(OwnerOrAdminGuard)
  @UseInterceptors(FilesInterceptor('files', 10, certificationUploadOptions))
  async uploadCertificationDocuments(
    @Param('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0)
      throw new BadRequestException('No se han subido archivos');

    const filenames = files.map((f) => f.filename);
    try {
      return await this.addFiles(
        userId,
        'certification_documents',
        filenames,
        'Error al guardar comprobantes de certificación',
      );
    } catch (error) {
      await Promise.all(
        filenames.map((name) => removeCertificationFile(userId, name)),
      );
      throw error;
    }
  }

  /** Los comprobantes son privados: <img> no alcanza, se piden con el token. */
  @Get('users/:userId/caregiver-profile/certifications/:filename')
  @UseGuards(OwnerOrAdminGuard)
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Ver un comprobante (dueño o admin)' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiParam({ name: 'filename', description: 'Nombre del archivo' })
  @ApiResponse({ status: 200, description: 'Imagen del comprobante' })
  @ApiResponse({ status: 403, description: 'Solo el dueño o un admin' })
  @ApiResponse({ status: 404, description: 'No existe' })
  getCertificationDocument(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
  ) {
    const { path, type } = certificationFile(userId, filename);
    if (!existsSync(path)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return new StreamableFile(createReadStream(path), { type });
  }

  @Delete('users/:userId/caregiver-profile/certifications/:filename')
  @Roles(UserRole.WALKER, UserRole.CAREGIVER, UserRole.ADMIN)
  @UseGuards(OwnerOrAdminGuard)
  @ApiOperation({ summary: 'Eliminar un comprobante' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiParam({ name: 'filename', description: 'Nombre del archivo' })
  @ApiResponse({ status: 200, description: 'Comprobante eliminado' })
  @ApiResponse({ status: 404, description: 'No es de este perfil' })
  async removeCertificationDocument(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
  ) {
    assertSavedFilename(filename);
    const profile = await this.removeFile(
      userId,
      'certification_documents',
      filename,
      'Error al eliminar el comprobante',
    );
    await removeCertificationFile(userId, filename);
    return profile;
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Crear una reseña a un cuidador (Solo Clientes)' })
  @ApiResponse({ status: 201, description: 'Reseña creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o error al registrar la reseña',
  })
  createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.users.send(
      'create_review',
      { ...createReviewDto, reviewer_id: request.user.sub },
      'Error al crear la reseña',
    );
  }

  @Patch('reviews/:reviewId')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Editar mi reseña (solo su autor)' })
  @ApiResponse({ status: 200, description: 'Reseña actualizada' })
  @ApiResponse({ status: 404, description: 'No existe o no es tuya' })
  updateReview(
    @Param() { reviewId }: ReviewIdParamDto,
    @Body() changes: UpdateReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.users.send(
      'update_review',
      { review_id: reviewId, reviewer_id: request.user.sub, changes },
      'Error al actualizar la reseña',
    );
  }

  @Delete('reviews/:reviewId')
  @Roles(UserRole.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar mi reseña (solo su autor)' })
  @ApiResponse({ status: 200, description: 'Reseña eliminada' })
  @ApiResponse({ status: 404, description: 'No existe o no es tuya' })
  deleteReview(
    @Param() { reviewId }: ReviewIdParamDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.users.send(
      'delete_review',
      { review_id: reviewId, reviewer_id: request.user.sub },
      'Error al eliminar la reseña',
    );
  }

  @Get('reviews/caregiver/:caregiverId/mine')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Mi reseña para este cuidador, si dejé una' })
  @ApiParam({ name: 'caregiverId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: '{ review } o { review: null }' })
  getMyReview(
    @Param('caregiverId') caregiverId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.users.send(
      'get_my_review',
      { caregiver_id: caregiverId, reviewer_id: request.user.sub },
      'Error al obtener tu reseña',
    );
  }

  @Get('reviews/caregiver/:caregiverId')
  @ApiOperation({ summary: 'Obtener reseñas de un cuidador (Paginado)' })
  @ApiParam({ name: 'caregiverId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: 'Listado de reseñas' })
  getReviewsForCaregiver(
    @Param('caregiverId') caregiverId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.users.send(
      'get_reviews_for_caregiver',
      { caregiver_id: caregiverId, pagination },
      'Error al obtener reseñas del cuidador',
    );
  }

  private addFiles(
    userId: string,
    field: CaregiverFileField,
    paths: string[],
    fallback: string,
  ) {
    return this.users.send(
      'add_caregiver_files',
      { user_id: userId, field, paths },
      fallback,
    );
  }

  private removeFile(
    userId: string,
    field: CaregiverFileField,
    path: string,
    fallback: string,
  ) {
    return this.users.send(
      'remove_caregiver_file',
      { user_id: userId, field, path },
      fallback,
    );
  }

  /** Multer ya guardó los archivos: si el perfil rechaza el cambio, no quedan huérfanos. */
  private async keepFilesOnlyIfSaved<T>(
    paths: string[],
    save: () => Promise<T>,
  ): Promise<T> {
    try {
      return await save();
    } catch (error) {
      await removeUploads(paths);
      throw error;
    }
  }

  private assertCanManageUser(
    userId: string,
    request: AuthenticatedRequest,
  ): void {
    if (request.user.role !== UserRole.ADMIN && request.user.sub !== userId) {
      throw new ForbiddenException('Solo puedes modificar tu propio perfil.');
    }
  }
}
