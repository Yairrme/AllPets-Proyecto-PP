import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type ReviewDocument = Review & Document;

@Schema({ 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reviewer_id: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  caregiver_id: Types.ObjectId | User;

  @Prop({ required: true, min: 1, max: 5 })
  score: number;

  @Prop({ required: false, default: '' })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
