import { Injectable, NotFoundException, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, CreateReviewDto, UserRole } from 'y/contracts';
import { User, UserDocument } from './schemas/user.schema';
import { CaregiverProfile, CaregiverProfileDocument } from './schemas/caregiver-profile.schema';
import { Review, ReviewDocument } from './schemas/review.schema';

@Injectable()
export class CoreUserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(CaregiverProfile.name) private readonly profileModel: Model<CaregiverProfileDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    private readonly jwtService: JwtService,
  ) {}

  // 1. AUTENTICACIÓN: Registro
  async register(registerDto: RegisterDto): Promise<any> {
    const { email, password, name, city, phone, role } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const createdUser = new this.userModel({
      name,
      email,
      password_hash,
      city,
      phone,
      role,
    });
    const savedUser = await createdUser.save();

    // Si el rol es paseador o cuidador, inicializar su perfil de cuidador
    if (role === UserRole.WALKER || role === UserRole.CAREGIVER) {
      const caregiverProfile = new this.profileModel({
        user_id: savedUser._id,
        bio: '',
        services: [],
        rating_avg: 0,
        availability: [],
      });
      await caregiverProfile.save();
    }

    // Retornar usuario sin la contraseña hash
    const userResponse = savedUser.toObject();
    delete (userResponse as any).password_hash;
    return userResponse;
  }

  // 2. AUTENTICACIÓN: Login
  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Generar JWT
    const payload = { sub: user._id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    const userResponse = user.toObject();
    delete (userResponse as any).password_hash;

    return {
      access_token: token,
      user: userResponse,
    };
  }

  // 3. GESTIÓN DE USUARIOS
  async getUserById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID no válido');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    const userResponse = user.toObject();
    delete (userResponse as any).password_hash;
    return userResponse;
  }

  async getAllUsers(): Promise<any[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => {
      const u = user.toObject();
      delete (u as any).password_hash;
      return u;
    });
  }

  // 4. PERFILES DE CUIDADORES / PASEADORES
  async getCaregiverProfileByUserId(userId: string): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const profile = await this.profileModel.findOne({ user_id: new Types.ObjectId(userId) }).exec();
    if (!profile) {
      throw new NotFoundException('Perfil de cuidador no encontrado');
    }
    return profile;
  }

  async updateCaregiverProfile(userId: string, updateData: Partial<CaregiverProfile>): Promise<CaregiverProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('ID de usuario no válido');
    }
    const profile = await this.profileModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();

    if (!profile) {
      throw new NotFoundException('Perfil de cuidador no encontrado para actualizar');
    }
    return profile;
  }

  // 5. RESEÑAS / VALORACIONES
  async createReview(createReviewDto: CreateReviewDto): Promise<Review> {
    const { reviewer_id, caregiver_id, score, comment } = createReviewDto;

    if (!Types.ObjectId.isValid(reviewer_id) || !Types.ObjectId.isValid(caregiver_id)) {
      throw new NotFoundException('IDs de usuario o cuidador inválidos');
    }

    // Verificar que el cuidador exista y tenga un rol adecuado
    const caregiverUser = await this.userModel.findById(caregiver_id).exec();
    if (!caregiverUser || (caregiverUser.role !== UserRole.WALKER && caregiverUser.role !== UserRole.CAREGIVER)) {
      throw new NotFoundException('El usuario calificado no es un paseador o cuidador válido');
    }

    const reviewerUser = await this.userModel.findById(reviewer_id).exec();
    if (!reviewerUser) {
      throw new NotFoundException('El usuario que deja la reseña no existe');
    }
    if (reviewerUser.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Solo los clientes pueden dejar reseñas');
    }
    if (reviewer_id === caregiver_id) {
      throw new ForbiddenException('No puedes dejarte una reseña a ti mismo');
    }

    // Guardar reseña
    const review = new this.reviewModel({
      reviewer_id: new Types.ObjectId(reviewer_id),
      caregiver_id: new Types.ObjectId(caregiver_id),
      score,
      comment,
    });
    const savedReview = await review.save();

    // Recalcular el rating_avg del cuidador
    await this.updateCaregiverAverageRating(caregiver_id);

    return savedReview;
  }

  async getReviewsForCaregiver(caregiverId: string): Promise<Review[]> {
    if (!Types.ObjectId.isValid(caregiverId)) {
      throw new NotFoundException('ID de cuidador no válido');
    }
    return this.reviewModel.find({ caregiver_id: new Types.ObjectId(caregiverId) })
      .populate('reviewer_id', 'name email')
      .exec();
  }

  // Función interna para recalcular promedio de estrellas
  private async updateCaregiverAverageRating(caregiverId: string): Promise<void> {
    const reviews = await this.reviewModel.find({ caregiver_id: new Types.ObjectId(caregiverId) }).exec();
    if (reviews.length === 0) return;

    const sum = reviews.reduce((acc, curr) => acc + curr.score, 0);
    const avg = parseFloat((sum / reviews.length).toFixed(2));

    await this.profileModel.updateOne(
      { user_id: new Types.ObjectId(caregiverId) },
      { $set: { rating_avg: avg } }
    ).exec();
  }
}