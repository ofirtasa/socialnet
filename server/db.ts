/**
 * db.ts — All database operations using MongoDB/Mongoose.
 * This replaces the previous MySQL/Drizzle implementation.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import {
  connectMongoDB,
  UserModel,
  PostModel,
  CommentModel,
  LikeModel,
  GroupModel,
  MessageModel,
  FriendshipModel,
  SessionModel,
  IUser,
  IPost,
  IGroup,
} from "./mongodb";

// Ensure connection on first use
async function db() {
  await connectMongoDB();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toId(id: string | mongoose.Types.ObjectId) {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

function safeUser(u: any) {
  if (!u) return undefined;
  const obj = u.toObject ? u.toObject() : u;
  return {
    id: obj._id.toString(),
    openId: obj.username, // compatibility shim for OAuth flow
    username: obj.username,
    name: obj.name,
    email: obj.email,
    bio: obj.bio,
    avatarUrl: obj.avatarUrl,
    role: obj.role as "user" | "admin",
    loginMethod: obj.loginMethod,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    lastSignedIn: obj.lastSignedIn,
  };
}

function safePost(p: any) {
  if (!p) return undefined;
  const obj = p.toObject ? p.toObject() : p;
  return {
    id: obj._id.toString(),
    authorId: obj.authorId.toString(),
    groupId: obj.groupId?.toString(),
    content: obj.content,
    imageUrl: obj.imageUrl,
    videoUrl: obj.videoUrl,
    postType: obj.postType,
    likesCount: obj.likesCount,
    commentsCount: obj.commentsCount,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function safeGroup(g: any) {
  if (!g) return undefined;
  const obj = g.toObject ? g.toObject() : g;
  return {
    id: obj._id.toString(),
    name: obj.name,
    description: obj.description,
    coverUrl: obj.coverUrl,
    isPrivate: obj.isPrivate,
    managerId: obj.managerId.toString(),
    membersCount: obj.membersCount,
    members: (obj.members || []).map((m: any) => ({
      userId: m.userId.toString(),
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    })),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function safeMessage(m: any) {
  if (!m) return undefined;
  const obj = m.toObject ? m.toObject() : m;
  return {
    id: obj._id.toString(),
    senderId: obj.senderId.toString(),
    receiverId: obj.receiverId.toString(),
    content: obj.content,
    isRead: obj.isRead,
    createdAt: obj.createdAt,
  };
}

function safeFriendship(f: any) {
  if (!f) return undefined;
  const obj = f.toObject ? f.toObject() : f;
  return {
    id: obj._id.toString(),
    requesterId: obj.requesterId.toString(),
    addresseeId: obj.addresseeId.toString(),
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(data: {
  openId?: string;
  username?: string;
  passwordHash?: string;
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  role?: "user" | "admin";
  loginMethod?: string;
  lastSignedIn?: Date;
}) {
  await db();
  if (!data.username) return;
  await UserModel.findOneAndUpdate(
    { username: data.username },
    { $set: { ...data, lastSignedIn: data.lastSignedIn || new Date() } },
    { upsert: true, new: true }
  );
}

export async function getUserByOpenId(openId: string) {
  // openId is stored as username prefix for local users
  await db();
  const user = await UserModel.findOne({ username: openId.replace("local_seed_", "").replace("local_", "") });
  return safeUser(user);
}

export async function getUserById(id: string) {
  await db();
  try {
    const user = await UserModel.findById(id);
    return safeUser(user);
  } catch {
    return undefined;
  }
}

export async function getUserByUsername(username: string) {
  await db();
  const user = await UserModel.findOne({ username: username.toLowerCase().trim() });
  return safeUser(user);
}

export async function getUserByUsernameRaw(username: string) {
  await db();
  return UserModel.findOne({ username: username.toLowerCase().trim() });
}

export async function getAllUsers(limit = 100) {
  await db();
  const users = await UserModel.find().sort({ createdAt: -1 }).limit(limit);
  return users.map(safeUser);
}

export async function searchUsers(params: { name?: string; role?: string; joinedAfter?: Date; joinedBefore?: Date }) {
  await db();
  const query: any = {};
  if (params.name) query.name = { $regex: params.name, $options: "i" };
  if (params.role) query.role = params.role;
  if (params.joinedAfter || params.joinedBefore) {
    query.createdAt = {};
    if (params.joinedAfter) query.createdAt.$gte = params.joinedAfter;
    if (params.joinedBefore) query.createdAt.$lte = params.joinedBefore;
  }
  const users = await UserModel.find(query).sort({ createdAt: -1 }).limit(50);
  return users.map(safeUser);
}

export async function updateUser(id: string, data: Partial<{ name: string; bio: string; avatarUrl: string; email: string; role: string; passwordHash: string }>) {
  await db();
  await UserModel.findByIdAndUpdate(id, { $set: data });
}

export async function deleteUser(id: string) {
  await db();
  await UserModel.findByIdAndDelete(id);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function createSession(userId: string, token: string, expiresAt: Date) {
  await db();
  await SessionModel.create({ userId: toId(userId), token, expiresAt });
}

export async function getSessionByToken(token: string) {
  await db();
  const session = await SessionModel.findOne({ token });
  if (!session) return undefined;
  const obj = session.toObject();
  return { userId: obj.userId.toString(), token: obj.token, expiresAt: obj.expiresAt };
}

export async function deleteSession(token: string) {
  await db();
  await SessionModel.deleteOne({ token });
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export async function createPost(data: { authorId: string; groupId?: string; content: string; imageUrl?: string; videoUrl?: string; postType?: string }) {
  await db();
  const post = await PostModel.create({
    authorId: toId(data.authorId),
    groupId: data.groupId ? toId(data.groupId) : undefined,
    content: data.content,
    imageUrl: data.imageUrl,
    videoUrl: data.videoUrl,
    postType: (data.postType as "text" | "image" | "video" | "canvas") || "text",
  });
  return safePost(post);
}

export async function getPostById(id: string) {
  await db();
  try {
    const post = await PostModel.findById(id);
    return safePost(post);
  } catch {
    return undefined;
  }
}

export async function updatePost(id: string, data: Partial<{ content: string; imageUrl: string; videoUrl: string; postType: string }>) {
  await db();
  await PostModel.findByIdAndUpdate(id, { $set: data });
}

export async function deletePost(id: string) {
  await db();
  await PostModel.findByIdAndDelete(id);
  await CommentModel.deleteMany({ postId: toId(id) });
  await LikeModel.deleteMany({ postId: toId(id) });
}

export async function getPostsByAuthor(authorId: string) {
  await db();
  const posts = await PostModel.find({ authorId: toId(authorId) }).sort({ createdAt: -1 }).limit(50);
  return posts.map(safePost);
}

export async function getPostsByGroup(groupId: string) {
  await db();
  const posts = await PostModel.find({ groupId: toId(groupId) }).sort({ createdAt: -1 }).limit(50);
  return posts.map(safePost);
}

export async function searchPosts(params: { keyword?: string; groupId?: string; authorId?: string; postType?: string; dateFrom?: Date; dateTo?: Date }) {
  await db();
  const query: any = {};
  if (params.keyword) query.$text = { $search: params.keyword };
  if (params.groupId) query.groupId = toId(params.groupId);
  if (params.authorId) query.authorId = toId(params.authorId);
  if (params.postType && ["text","image","video","canvas"].includes(params.postType)) {
    query.postType = params.postType as "text" | "image" | "video" | "canvas";
  }
  if (params.dateFrom || params.dateTo) {
    query.createdAt = {};
    if (params.dateFrom) query.createdAt.$gte = params.dateFrom;
    if (params.dateTo) query.createdAt.$lte = params.dateTo;
  }
  const posts = await PostModel.find(query).sort({ createdAt: -1 }).limit(50);
  return posts.map(safePost);
}

export async function getAllPosts(limit = 100) {
  await db();
  const posts = await PostModel.find().sort({ createdAt: -1 }).limit(limit);
  return posts.map(safePost);
}

export async function getFeedPosts(userId: string) {
  await db();
  // Get friend IDs
  const friendships = await FriendshipModel.find({
    $or: [{ requesterId: toId(userId) }, { addresseeId: toId(userId) }],
    status: "accepted",
  });
  const friendIds = friendships.map((f) =>
    f.requesterId.toString() === userId ? f.addresseeId : f.requesterId
  );

  // Get joined group IDs
  const joinedGroups = await GroupModel.find({
    "members.userId": toId(userId),
    "members.status": "approved",
  });
  const groupIds = joinedGroups.map((g) => g._id);

  const query: any = {
    $or: [
      { authorId: toId(userId) },
      ...(friendIds.length > 0 ? [{ authorId: { $in: friendIds } }] : []),
      ...(groupIds.length > 0 ? [{ groupId: { $in: groupIds } }] : []),
    ],
  };

  const posts = await PostModel.find(query).sort({ createdAt: -1 }).limit(100);
  return posts.map(safePost);
}

// ─── Likes ────────────────────────────────────────────────────────────────────
export async function likePost(postId: string, userId: string) {
  await db();
  try {
    await LikeModel.create({ postId: toId(postId), userId: toId(userId) });
    await PostModel.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
  } catch {
    // Already liked
  }
}

export async function unlikePost(postId: string, userId: string) {
  await db();
  const result = await LikeModel.deleteOne({ postId: toId(postId), userId: toId(userId) });
  if (result.deletedCount > 0) {
    await PostModel.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
  }
}

export async function getUserLikes(userId: string) {
  await db();
  const likes = await LikeModel.find({ userId: toId(userId) });
  return likes.map((l) => ({ postId: l.postId.toString(), userId: l.userId.toString() }));
}

export async function isPostLikedByUser(postId: string, userId: string) {
  await db();
  const like = await LikeModel.findOne({ postId: toId(postId), userId: toId(userId) });
  return !!like;
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export async function addComment(postId: string, authorId: string, content: string) {
  await db();
  const comment = await CommentModel.create({ postId: toId(postId), authorId: toId(authorId), content });
  await PostModel.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
  const obj = comment.toObject();
  return { id: obj._id.toString(), postId: obj.postId.toString(), authorId: obj.authorId.toString(), content: obj.content, createdAt: obj.createdAt };
}

export async function getCommentsByPost(postId: string) {
  await db();
  const comments = await CommentModel.find({ postId: toId(postId) }).sort({ createdAt: 1 }).limit(100);
  return comments.map((c) => {
    const obj = c.toObject();
    return { id: obj._id.toString(), postId: obj.postId.toString(), authorId: obj.authorId.toString(), content: obj.content, createdAt: obj.createdAt };
  });
}

export async function deleteComment(id: string) {
  await db();
  const comment = await CommentModel.findById(id);
  if (comment) {
    await comment.deleteOne();
    await PostModel.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });
  }
}

// ─── Groups ───────────────────────────────────────────────────────────────────
export async function createGroup(data: { name: string; description?: string; isPrivate: boolean; managerId: string; coverUrl?: string }) {
  await db();
  const group = await GroupModel.create({
    name: data.name,
    description: data.description,
    isPrivate: data.isPrivate,
    managerId: toId(data.managerId),
    coverUrl: data.coverUrl,
    membersCount: 1,
    members: [{ userId: toId(data.managerId), role: "admin", status: "approved", joinedAt: new Date() }],
  });
  return group._id.toString();
}

export async function getGroupById(id: string) {
  await db();
  try {
    const group = await GroupModel.findById(id);
    return safeGroup(group);
  } catch {
    return undefined;
  }
}

export async function getAllGroups(limit = 50) {
  await db();
  const groups = await GroupModel.find().sort({ createdAt: -1 }).limit(limit);
  return groups.map(safeGroup);
}

export async function getPublicGroups() {
  await db();
  const groups = await GroupModel.find({ isPrivate: false }).sort({ membersCount: -1 }).limit(50);
  return groups.map(safeGroup);
}

export async function searchGroups(params: { name?: string; isPrivate?: boolean; managerId?: string }) {
  await db();
  const query: any = {};
  if (params.name) query.name = { $regex: params.name, $options: "i" };
  if (params.isPrivate !== undefined) query.isPrivate = params.isPrivate;
  if (params.managerId) query.managerId = toId(params.managerId);
  const groups = await GroupModel.find(query).sort({ createdAt: -1 }).limit(50);
  return groups.map(safeGroup);
}

export async function updateGroup(id: string, data: Partial<{ name: string; description: string; isPrivate: boolean; coverUrl: string }>) {
  await db();
  await GroupModel.findByIdAndUpdate(id, { $set: data });
}

export async function deleteGroup(id: string) {
  await db();
  await GroupModel.findByIdAndDelete(id);
  await PostModel.deleteMany({ groupId: toId(id) });
}

export async function getUserGroups(userId: string) {
  await db();
  const groups = await GroupModel.find({
    "members.userId": toId(userId),
    "members.status": "approved",
  }).sort({ createdAt: -1 });
  return groups.map(safeGroup);
}

export async function getGroupMembers(groupId: string) {
  await db();
  const group = await GroupModel.findById(groupId);
  if (!group) return [];
  return (group.members || []).map((m: any) => ({
    userId: m.userId.toString(),
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt,
  }));
}

export async function getGroupMembership(groupId: string, userId: string) {
  await db();
  const group = await GroupModel.findById(groupId);
  if (!group) return null;
  const member = group.members.find((m: any) => m.userId.toString() === userId);
  if (!member) return null;
  return { userId: member.userId.toString(), role: member.role, status: member.status, joinedAt: member.joinedAt };
}

export async function joinGroup(groupId: string, userId: string, isPrivate: boolean) {
  await db();
  const group = await GroupModel.findById(groupId);
  if (!group) return;
  const existing = group.members.find((m: any) => m.userId.toString() === userId);
  if (existing) return;
  const status = isPrivate ? "pending" : "approved";
  group.members.push({ userId: toId(userId) as any, role: "member", status, joinedAt: new Date() });
  if (!isPrivate) group.membersCount = (group.membersCount || 0) + 1;
  await group.save();
}

export async function leaveGroup(groupId: string, userId: string) {
  await db();
  await GroupModel.findByIdAndUpdate(groupId, {
    $pull: { members: { userId: toId(userId) } },
    $inc: { membersCount: -1 },
  });
}

export async function approveGroupMember(groupId: string, userId: string) {
  await db();
  await GroupModel.findOneAndUpdate(
    { _id: toId(groupId), "members.userId": toId(userId) },
    { $set: { "members.$.status": "approved" }, $inc: { membersCount: 1 } }
  );
}

export async function rejectGroupMember(groupId: string, userId: string) {
  await db();
  await GroupModel.findOneAndUpdate(
    { _id: toId(groupId), "members.userId": toId(userId) },
    { $set: { "members.$.status": "rejected" } }
  );
}

export async function removeGroupMember(groupId: string, userId: string) {
  await db();
  await GroupModel.findByIdAndUpdate(groupId, {
    $pull: { members: { userId: toId(userId) } },
    $inc: { membersCount: -1 },
  });
}

export async function setGroupMemberRole(groupId: string, userId: string, role: "admin" | "member") {
  await db();
  await GroupModel.findOneAndUpdate(
    { _id: toId(groupId), "members.userId": toId(userId) },
    { $set: { "members.$.role": role } }
  );
}

export async function getPendingGroupRequests(groupId: string) {
  await db();
  const group = await GroupModel.findById(groupId);
  if (!group) return [];
  return group.members
    .filter((m: any) => m.status === "pending")
    .map((m: any) => ({ userId: m.userId.toString(), role: m.role, status: m.status, joinedAt: m.joinedAt }));
}

// ─── Friendships ──────────────────────────────────────────────────────────────
export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  await db();
  try {
    await FriendshipModel.create({ requesterId: toId(requesterId), addresseeId: toId(addresseeId) });
  } catch {
    // Already exists
  }
}

export async function getFriendship(userId1: string, userId2: string) {
  await db();
  const f = await FriendshipModel.findOne({
    $or: [
      { requesterId: toId(userId1), addresseeId: toId(userId2) },
      { requesterId: toId(userId2), addresseeId: toId(userId1) },
    ],
  });
  return safeFriendship(f);
}

export async function getFriendshipById(id: string) {
  await db();
  try {
    const f = await FriendshipModel.findById(id);
    return safeFriendship(f);
  } catch {
    return undefined;
  }
}

export async function updateFriendship(id: string, status: "accepted" | "rejected") {
  await db();
  await FriendshipModel.findByIdAndUpdate(id, { $set: { status } });
}

export async function getFriends(userId: string) {
  await db();
  const friends = await FriendshipModel.find({
    $or: [{ requesterId: toId(userId) }, { addresseeId: toId(userId) }],
    status: "accepted",
  });
  return friends.map(safeFriendship);
}

export async function getPendingFriendRequests(userId: string) {
  await db();
  const requests = await FriendshipModel.find({ addresseeId: toId(userId), status: "pending" });
  return requests.map(safeFriendship);
}

export async function getSentFriendRequests(userId: string) {
  await db();
  const requests = await FriendshipModel.find({ requesterId: toId(userId), status: "pending" });
  return requests.map(safeFriendship);
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function sendMessage(data: { senderId: string; receiverId: string; content: string }) {
  await db();
  const msg = await MessageModel.create({
    senderId: toId(data.senderId),
    receiverId: toId(data.receiverId),
    content: data.content,
  });
  return safeMessage(msg);
}

export async function getConversation(userId1: string, userId2: string) {
  await db();
  const msgs = await MessageModel.find({
    $or: [
      { senderId: toId(userId1), receiverId: toId(userId2) },
      { senderId: toId(userId2), receiverId: toId(userId1) },
    ],
  }).sort({ createdAt: 1 }).limit(200);
  return msgs.map(safeMessage);
}

export async function getConversationList(userId: string) {
  await db();
  const sent = await MessageModel.distinct("receiverId", { senderId: toId(userId) });
  const received = await MessageModel.distinct("senderId", { receiverId: toId(userId) });
  const all = Array.from(new Set([...sent.map(String), ...received.map(String)]));
  return all.filter((id) => id !== userId);
}

export async function markMessagesRead(senderId: string, receiverId: string) {
  await db();
  await MessageModel.updateMany(
    { senderId: toId(senderId), receiverId: toId(receiverId) },
    { $set: { isRead: true } }
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getPostsPerMonth() {
  await db();
  const result = await PostModel.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 12 },
    { $project: { month: "$_id", count: 1, _id: 0 } },
  ]);
  return result;
}

export async function getUserActivityOverTime() {
  await db();
  const result = await UserModel.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        newUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 12 },
    { $project: { month: "$_id", newUsers: 1, _id: 0 } },
  ]);
  return result;
}

export async function getGroupPostStats() {
  await db();
  const result = await PostModel.aggregate([
    { $match: { groupId: { $exists: true, $ne: null } } },
    { $group: { _id: "$groupId", postCount: { $sum: 1 } } },
    { $sort: { postCount: -1 } },
    { $limit: 10 },
  ]);
  const withNames = await Promise.all(
    result.map(async (r) => {
      const group = await GroupModel.findById(r._id);
      return { groupName: group?.name || "Unknown", postCount: r.postCount };
    })
  );
  return withNames;
}

export async function getTotalStats() {
  await db();
  const [users, posts, groups, messages] = await Promise.all([
    UserModel.countDocuments(),
    PostModel.countDocuments(),
    GroupModel.countDocuments(),
    MessageModel.countDocuments(),
  ]);
  return { users, posts, groups, messages };
}
