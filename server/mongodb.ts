import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Connection ───────────────────────────────────────────────────────────────
let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("[MongoDB] MONGO_URI not set, skipping connection");
    return;
  }
  try {
    await mongoose.connect(uri, { dbName: "android2-project-cluster" });
    isConnected = true;
    console.log("[MongoDB] Connected to Atlas cluster");
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err);
    throw err;
  }
}

// ─── User Model ───────────────────────────────────────────────────────────────
export interface IUser extends Document {
  username: string;
  passwordHash: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  role: "user" | "admin";
  loginMethod: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    bio: { type: String, maxlength: 500 },
    avatarUrl: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    loginMethod: { type: String, default: "local" },
    lastSignedIn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// ─── Post Model ───────────────────────────────────────────────────────────────
export interface IPost extends Document {
  authorId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  postType: "text" | "image" | "video" | "canvas";
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    content: { type: String, required: true, maxlength: 5000 },
    imageUrl: { type: String },
    videoUrl: { type: String },
    postType: { type: String, enum: ["text", "image", "video", "canvas"], default: "text" },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ groupId: 1, createdAt: -1 });
PostSchema.index({ content: "text" });

export const PostModel: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

// ─── Comment Model ────────────────────────────────────────────────────────────
export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

CommentSchema.index({ postId: 1, createdAt: 1 });

export const CommentModel: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

// ─── Like Model ───────────────────────────────────────────────────────────────
export interface ILike extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const LikeModel: Model<ILike> =
  mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema);

// ─── Group Model ──────────────────────────────────────────────────────────────
export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: "admin" | "member";
  status: "pending" | "approved" | "rejected";
  joinedAt: Date;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  coverUrl?: string;
  isPrivate: boolean;
  managerId: mongoose.Types.ObjectId;
  members: IGroupMember[];
  membersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 128 },
    description: { type: String, maxlength: 2000 },
    coverUrl: { type: String },
    isPrivate: { type: Boolean, default: false },
    managerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [GroupMemberSchema],
    membersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

GroupSchema.index({ name: "text" });

export const GroupModel: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);

// ─── Message Model ────────────────────────────────────────────────────────────
export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 5000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

export const MessageModel: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

// ─── Friendship Model ─────────────────────────────────────────────────────────
export interface IFriendship extends Document {
  requesterId: mongoose.Types.ObjectId;
  addresseeId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    addresseeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

FriendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true });

export const FriendshipModel: Model<IFriendship> =
  mongoose.models.Friendship || mongoose.model<IFriendship>("Friendship", FriendshipSchema);

// ─── Session Model ────────────────────────────────────────────────────────────
export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
