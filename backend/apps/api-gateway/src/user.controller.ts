import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Inject,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
  Delete,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateReviewDto,
  PaginationDto,
  UpdateCaregiverProfileDto,
  UserRole,
} from 'y/contracts';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import type { AuthenticatedRequest } from './auth/auth.types';

// Configuración de Multer para guardar localmente en 'uploads'
const multerOptions = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(
        null,
        `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
      );
    },
  }),
};

mkdirSync(join(process.cwd(), 'uploads'), { recursive: true });

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Get('users/:id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado o ID inválido' })
  async getUserById(@Param('id') id: string) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_user_by_id' }, id),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener usuario',
      );
    }
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a eliminar' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (Requiere rol ADMIN)' })
  async deleteUser(@Param('id') id: string) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'delete_user' }, id),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al eliminar usuario',
      );
    }
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los usuarios (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Listado de usuarios' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (Requiere rol ADMIN)' })
  async getAllUsers(@Query() pagination: PaginationDto) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_all_users' }, pagination),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener usuarios',
      );
    }
  }

  @Get('users/:userId/caregiver-profile')
  @ApiOperation({ summary: 'Obtener perfil de cuidador detallado' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  async getCaregiverProfile(@Param('userId') userId: string) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'get_caregiver_profile' },
          { user_id: userId },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener el perfil del cuidador',
      );
    }
  }

  @Put('users/:userId/caregiver-profile')
  @Roles(UserRole.WALKER, UserRole.CAREGIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar perfil de cuidador/paseador' })
  @ApiParam({ name: 'userId', description: 'ID del cuidador a actualizar' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 403, description: 'Solo puedes modificar tu propio perfil' })
  async updateCaregiverProfile(
    @Param('userId') userId: string,
    @Body() updateData: UpdateCaregiverProfileDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertCanManageUser(userId, request);
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'update_caregiver_profile' },
          { user_id: userId, updateData },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al actualizar el perfil del cuidador',
      );
    }
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
  @ApiResponse({ status: 200, description: 'Foto de perfil subida exitosamente' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadUserImage(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    this.assertCanManageUser(userId, request);
    const imageUrl = `/uploads/${file.filename}`;
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'update_user_profile_image' },
          { user_id: userId, profile_image: imageUrl },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al guardar la imagen de perfil del usuario',
      );
    }
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
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadProfileImage(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    this.assertCanManageUser(userId, request);
    const imageUrl = `/uploads/${file.filename}`;
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'update_caregiver_profile' },
          { user_id: userId, updateData: { profile_image: imageUrl } },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al guardar la imagen de perfil',
      );
    }
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
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadGalleryImages(
    @Param('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: AuthenticatedRequest,
  ) {
    if (!files || files.length === 0)
      throw new BadRequestException('No se han subido archivos');
    this.assertCanManageUser(userId, request);

    // Obtener perfil actual para añadir las imágenes, no sobrescribirlas
    let currentProfile: any;
    try {
      currentProfile = await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'get_caregiver_profile' },
          { user_id: userId },
        ),
      );
    } catch {
      // Ignorar, si no existe el array estará vacío
    }

    const currentGallery = currentProfile?.gallery_images || [];
    const newImageUrls = files.map((f) => `/uploads/${f.filename}`);
    const updatedGallery = [...currentGallery, ...newImageUrls];

    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'update_caregiver_profile' },
          { user_id: userId, updateData: { gallery_images: updatedGallery } },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al guardar imágenes en la galería',
      );
    }
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Crear una reseña a un cuidador (Solo Clientes)' })
  @ApiResponse({ status: 201, description: 'Reseña creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o error al registrar la reseña' })
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'create_review' },
          { ...createReviewDto, reviewer_id: request.user.sub },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al crear la reseña',
      );
    }
  }

  @Get('reviews/caregiver/:caregiverId')
  @ApiOperation({ summary: 'Obtener reseñas de un cuidador (Paginado)' })
  @ApiParam({ name: 'caregiverId', description: 'ID del cuidador' })
  @ApiResponse({ status: 200, description: 'Listado de reseñas' })
  async getReviewsForCaregiver(
    @Param('caregiverId') caregiverId: string,
    @Query() pagination: PaginationDto,
  ) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'get_reviews_for_caregiver' },
          { caregiver_id: caregiverId, pagination },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener reseñas del cuidador',
      );
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
