import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CoreUserService } from './core-user-service.service';
import { RegisterDto, LoginDto, CreateReviewDto } from 'y/contracts';

@Controller()
export class CoreUserServiceController {
  constructor(private readonly coreUserService: CoreUserService) {}

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

  @MessagePattern({ cmd: 'get_all_users' })
  async getAllUsers() {
    return this.coreUserService.getAllUsers();
  }

  @MessagePattern({ cmd: 'get_caregiver_profile' })
  async getCaregiverProfile(@Payload() data: { user_id: string }) {
    return this.coreUserService.getCaregiverProfileByUserId(data.user_id);
  }

  @MessagePattern({ cmd: 'update_caregiver_profile' })
  async updateCaregiverProfile(@Payload() data: { user_id: string; updateData: any }) {
    return this.coreUserService.updateCaregiverProfile(data.user_id, data.updateData);
  }

  @MessagePattern({ cmd: 'create_review' })
  async createReview(@Payload() createReviewDto: CreateReviewDto) {
    return this.coreUserService.createReview(createReviewDto);
  }

  @MessagePattern({ cmd: 'get_reviews_for_caregiver' })
  async getReviewsForCaregiver(@Payload() data: { caregiver_id: string }) {
    return this.coreUserService.getReviewsForCaregiver(data.caregiver_id);
  }
}
