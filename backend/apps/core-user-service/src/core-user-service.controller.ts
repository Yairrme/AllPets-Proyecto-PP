import { Controller } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CoreUserService } from './core-user-service.service';
import {
  RegisterDto,
  LoginDto,
  CreateReviewDto,
  PaginationDto,
  UpdateCaregiverProfileDto,
} from 'y/contracts';

@Controller()
export class CoreUserServiceController {
  constructor(
    private readonly coreUserService: CoreUserService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @MessagePattern({ cmd: 'health_check' })
  healthCheck() {
    return {
      status: this.connection.readyState === 1 ? 'ok' : 'degraded',
      service: 'core-user-service',
      database: this.connection.readyState === 1 ? 'connected' : 'disconnected',
    };
  }

  @MessagePattern({ cmd: 'register_user' })
  async register(@Payload() registerDto: RegisterDto) {
    return this.coreUserService.register(registerDto);
  }

  @MessagePattern({ cmd: 'login_user' })
  async login(@Payload() loginDto: LoginDto) {
    return this.coreUserService.login(loginDto);
  }

  @MessagePattern({ cmd: 'get_user_by_id' })
  async getUserById(@Payload() id: string) {
    return this.coreUserService.getUserById(id);
  }

  @MessagePattern({ cmd: 'delete_user' })
  async deleteUser(@Payload() id: string) {
    return this.coreUserService.deleteUser(id);
  }

  @MessagePattern({ cmd: 'update_user_profile_image' })
  async updateUserProfileImage(
    @Payload() data: { user_id: string; profile_image: string },
  ) {
    return this.coreUserService.updateUserProfileImage(
      data.user_id,
      data.profile_image,
    );
  }

  @MessagePattern({ cmd: 'get_all_users' })
  async getAllUsers(@Payload() pagination: PaginationDto) {
    return this.coreUserService.getAllUsers(pagination);
  }

  @MessagePattern({ cmd: 'get_caregivers' })
  async getCaregivers(@Payload() pagination: PaginationDto) {
    return this.coreUserService.getCaregivers(pagination);
  }

  @MessagePattern({ cmd: 'get_caregiver_profile' })
  async getCaregiverProfile(@Payload() data: { user_id: string }) {
    return this.coreUserService.getCaregiverProfileByUserId(data.user_id);
  }

  @MessagePattern({ cmd: 'update_caregiver_profile' })
  async updateCaregiverProfile(
    @Payload() data: { user_id: string; updateData: UpdateCaregiverProfileDto },
  ) {
    return this.coreUserService.updateCaregiverProfile(
      data.user_id,
      data.updateData,
    );
  }

  @MessagePattern({ cmd: 'create_review' })
  async createReview(@Payload() createReviewDto: CreateReviewDto) {
    return this.coreUserService.createReview(createReviewDto);
  }

  @MessagePattern({ cmd: 'get_reviews_for_caregiver' })
  async getReviewsForCaregiver(
    @Payload() data: { caregiver_id: string; pagination: PaginationDto },
  ) {
    return this.coreUserService.getReviewsForCaregiver(
      data.caregiver_id,
      data.pagination,
    );
  }
}
