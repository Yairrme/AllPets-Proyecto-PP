import { Controller, Get, Post, Put, Body, Param, Inject, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateReviewDto } from 'y/contracts';

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
