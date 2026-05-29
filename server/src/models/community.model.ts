// --- Post.ts ---
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPost extends Document {
  userId: Types.ObjectId;
  content: string;
  mediaUrl?: string; // S3 image url
  likeCount: number; // Cached count for fast feed loading
  commentCount: number;
  isLiked?: boolean;
}

const PostSchema = new Schema<IPost>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 500 },
  mediaUrl: { type: String },
  likeCount: { type: Number, default: 0 },
  isLiked: { type: Boolean, default: false },
  commentCount: { type: Number, default: 0 },
}, { timestamps: true });

// INDEX: Sort feed by newest instantly
PostSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);


// --- Like.ts ---
export interface ILike extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
}

const LikeSchema = new Schema<ILike>({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// INDEX: Prevent a user from liking the same post twice
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const Like = mongoose.model<ILike>('Like', LikeSchema);

// --- Comment.ts ---
export interface IComment extends Document {
    postId: Types.ObjectId;
    userId: Types.ObjectId;
    content: string;
}

const CommentSchema = new Schema<IComment>({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
}, { timestamps: true });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);

// --- Squad.ts ---
export interface ISquad extends Document {
    name: string;
    description?: string;
    members: Types.ObjectId[];
    creatorId: Types.ObjectId;
    leaderboardScore: number;
}

const SquadSchema = new Schema<ISquad>({
    name: { type: String, required: true },
    description: { type: String },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leaderboardScore: { type: Number, default: 0 },
}, { timestamps: true });

export const Squad = mongoose.model<ISquad>('Squad', SquadSchema);