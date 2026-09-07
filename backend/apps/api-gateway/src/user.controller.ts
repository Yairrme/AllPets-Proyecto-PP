import { Controller, Get, Post, Put, Body, Param, Inject, HttpStatus, HttpCode, BadRequestException, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateReviewDto } from 'y/contracts';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Configuración de Multer para guardar localmente en 'uploads'
const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
};

@Controller()
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_user_by_id' }, id),
      );
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al obtener usuario');
    }
  }

  @Get('users')
  async getAllUsers() {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_all_users' }, {}),
      );
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al obtener usuarios');
    }
  }

  @Get('users/:userId/caregiver-profile')
  async getCaregiverProfile(@Param('userId') userId: string) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_caregiver_profile' }, { user_id: userId }),
      );
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al obtener el perfil del cuidador');
    }
  }

  @Put('users/:userId/caregiver-profile')
  async updateCaregiverProfile(
    @Param('userId') userId: string,
    @Body() updateData: any,
  ) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'update_caregiver_profile' }, { user_id: userId, updateData }),
      );
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al actualizar el perfil del cuidador');
    }
  }

  @Post('users/:userId/caregiver-profile/image')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadProfileImage(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    const imageUrl = `/uploads/${file.filename}`;
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'update_caregiver_profile' }, { user_id: userId, updateData: { profile_image: imageUrl } }),
      );
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al guardar la imagen de perfil');
    }
  }

  @Post('users/:userId/caregiver-profile/gallery')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadGalleryImages(
    @Param('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No se han subido archivos');
    
    // Obtener perfil actual para añadir las imágenes, no sobrescribirlas
    let currentProfile: any;
    try {
      currentProfile = await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_caregiver_profile' }, { user_id: userId }),
      );
    } catch (e) {
      // Ignorar, si no existe el array estará vacío
    }

    const currentGallery = currentProfile?.gallery_images || [];
    const newImageUrls = files.map(f => `/uploads/${f.filename}`);
    const updatedGallery = [...currentGallery, ...newImageUrls];

    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'update_caregiver_profile' }, { user_id: userId, updateData: { gallery_images: updatedGallery } }),
      );
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al guardar imágenes en la galería');
    }
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  async createReview(@Body() createReviewDto: CreateReviewDto) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'create_review' }, createReviewDto),
      );
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al crear la reseña');
    }
  }

  @Get('reviews/caregiver/:caregiverId')
  async getReviewsForCaregiver(@Param('caregiverId') caregiverId: string) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_reviews_for_caregiver' }, { caregiver_id: caregiverId }),
      );
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al obtener reseñas del cuidador');
    }
  }
}
