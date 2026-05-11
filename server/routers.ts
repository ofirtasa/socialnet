import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  addComment,
  approveGroupMember,
  createGroup,
  createPost,
  createSession,
  deleteComment,
  deleteGroup,
  deletePost,
  deleteSession,
  deleteUser,
  getAllGroups,
  getAllPosts,
  getAllUsers,
  getCommentsByPost,
  getConversation,
  getConversationList,
  getFeedPosts,
  getFriendship,
  getFriends,
  getGroupById,
  getGroupMembers,
  getGroupMembership,
  getGroupPostStats,
  getPendingFriendRequests,
  getPendingGroupRequests,
  getPostById,
  getPostsByAuthor,
  getPostsByGroup,
  getPostsPerMonth,
  getPublicGroups,
  getSentFriendRequests,
  getSessionByToken,
  getTotalStats,
  getUserActivityOverTime,
  getUserById,
  getUserByUsername,
  getUserByUsernameRaw,
  getUserGroups,
  getUserLikes,
  isPostLikedByUser,
  joinGroup,
  leaveGroup,
  likePost,
  markMessagesRead,
  rejectGroupMember,
  removeGroupMember,
  searchGroups,
  searchPosts,
  searchUsers,
  sendFriendRequest,
  sendMessage,
  setGroupMemberRole,
  unlikePost,
  updateFriendship,
  updateGroup,
  updatePost,
  updateUser,
} from "./db";
import { connectMongoDB } from "./mongodb";

// Ensure MongoDB is connected on startup
connectMongoDB().catch(console.error);

// ─── Auth Router ──────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        password: z.string().min(6),
        name: z.string().min(1).max(64),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });

      const passwordHash = await bcrypt.hash(input.password, 12);
      const { UserModel } = await import("./mongodb");
      const user = await UserModel.create({
        username: input.username.toLowerCase(),
        passwordHash,
        name: input.name,
        email: input.email,
        loginMethod: "local",
        role: "user",
        lastSignedIn: new Date(),
      });

      const userId = user._id.toString();
      const token = nanoid(64);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await createSession(userId, token, expiresAt);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie("sn_session", token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return {
        success: true,
        user: { id: userId, username: user.username, name: user.name, role: user.role },
      };
    }),

  login: publicProcedure
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      // Use raw model to get passwordHash
      const userDoc = await getUserByUsernameRaw(input.username);
      if (!userDoc) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });

      const valid = await bcrypt.compare(input.password, userDoc.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });

      const userId = userDoc._id.toString();
      const token = nanoid(64);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await createSession(userId, token, expiresAt);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie("sn_session", token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      await updateUser(userId, { lastSignedIn: new Date() } as any);

      return {
        success: true,
        user: { id: userId, username: userDoc.username, name: userDoc.name, role: userDoc.role },
      };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const token = ctx.req.cookies?.sn_session;
    if (token) await deleteSession(token);
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie("sn_session", { ...cookieOptions, maxAge: -1 });
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  getLocalUser: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.sn_session;
    if (!token) return null;
    const session = await getSessionByToken(token);
    if (!session || session.expiresAt < new Date()) return null;
    const user = await getUserById(session.userId);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      email: user.email,
      createdAt: user.createdAt,
    };
  }),
});

// ─── Users Router ─────────────────────────────────────────────────────────────
const usersRouter = router({
  list: publicProcedure.query(() => getAllUsers()),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  search: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        role: z.string().optional(),
        joinedAfter: z.string().optional(),
        joinedBefore: z.string().optional(),
      })
    )
    .query(({ input }) =>
      searchUsers({
        name: input.name,
        role: input.role,
        joinedAfter: input.joinedAfter ? new Date(input.joinedAfter) : undefined,
        joinedBefore: input.joinedBefore ? new Date(input.joinedBefore) : undefined,
      })
    ),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateUser(id, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deleteUser(input.id);
      return { success: true };
    }),
});

// ─── Posts Router ─────────────────────────────────────────────────────────────
const postsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        authorId: z.string(),
        groupId: z.string().optional(),
        content: z.string().min(1).max(5000),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        postType: z.enum(["text", "image", "video", "canvas"]).default("text"),
      })
    )
    .mutation(async ({ input }) => {
      const post = await createPost(input);
      return { success: true, post };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(5000).optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        postType: z.enum(["text", "image", "video", "canvas"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePost(id, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deletePost(input.id);
      return { success: true };
    }),

  byAuthor: publicProcedure
    .input(z.object({ authorId: z.string() }))
    .query(({ input }) => getPostsByAuthor(input.authorId)),

  byGroup: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(({ input }) => getPostsByGroup(input.groupId)),

  feed: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getFeedPosts(input.userId)),

  search: publicProcedure
    .input(
      z.object({
        keyword: z.string().optional(),
        groupId: z.string().optional(),
        authorId: z.string().optional(),
        postType: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(({ input }) =>
      searchPosts({
        keyword: input.keyword,
        groupId: input.groupId,
        authorId: input.authorId,
        postType: input.postType,
        dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
        dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
      })
    ),

  all: publicProcedure.query(() => getAllPosts()),

  like: publicProcedure
    .input(z.object({ postId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      await likePost(input.postId, input.userId);
      return { success: true };
    }),

  unlike: publicProcedure
    .input(z.object({ postId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      await unlikePost(input.postId, input.userId);
      return { success: true };
    }),

  userLikes: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getUserLikes(input.userId)),

  isLiked: publicProcedure
    .input(z.object({ postId: z.string(), userId: z.string() }))
    .query(({ input }) => isPostLikedByUser(input.postId, input.userId)),

  addComment: publicProcedure
    .input(z.object({ postId: z.string(), authorId: z.string(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      const comment = await addComment(input.postId, input.authorId, input.content);
      return { success: true, comment };
    }),

  getComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(({ input }) => getCommentsByPost(input.postId)),

  deleteComment: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deleteComment(input.id);
      return { success: true };
    }),
});

// ─── Groups Router ────────────────────────────────────────────────────────────
const groupsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        isPrivate: z.boolean().default(false),
        managerId: z.string(),
        coverUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createGroup(input);
      return { success: true, id };
    }),

  list: publicProcedure.query(() => getAllGroups()),
  publicList: publicProcedure.query(() => getPublicGroups()),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const group = await getGroupById(input.id);
      if (!group) throw new TRPCError({ code: "NOT_FOUND" });
      return group;
    }),

  search: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        isPrivate: z.boolean().optional(),
        managerId: z.string().optional(),
      })
    )
    .query(({ input }) => searchGroups(input)),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        isPrivate: z.boolean().optional(),
        coverUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateGroup(id, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deleteGroup(input.id);
      return { success: true };
    }),

  userGroups: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getUserGroups(input.userId)),

  members: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(({ input }) => getGroupMembers(input.groupId)),

  membership: publicProcedure
    .input(z.object({ groupId: z.string(), userId: z.string() }))
    .query(({ input }) => getGroupMembership(input.groupId, input.userId)),

  join: publicProcedure
    .input(z.object({ groupId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const group = await getGroupById(input.groupId);
      if (!group) throw new TRPCError({ code: "NOT_FOUND" });
      await joinGroup(input.groupId, input.userId, group.isPrivate);
      return { success: true, pending: group.isPrivate };
    }),

  leave: publicProcedure
    .input(z.object({ groupId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      await leaveGroup(input.groupId, input.userId);
      return { success: true };
    }),

  pendingRequests: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(({ input }) => getPendingGroupRequests(input.groupId)),

  approve: publicProcedure
    .input(z.object({ groupId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      await approveGroupMember(input.groupId, input.userId);
      return { success: true };
    }),

  reject: publicProcedure
    .input(z.object({ groupId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      await rejectGroupMember(input.groupId, input.userId);
      return { success: true };
    }),

  removeMember: publicProcedure
    .input(z.object({ groupId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      await removeGroupMember(input.groupId, input.userId);
      return { success: true };
    }),

  setMemberRole: publicProcedure
    .input(z.object({ groupId: z.string(), userId: z.string(), role: z.enum(["admin", "member"]) }))
    .mutation(async ({ input }) => {
      await setGroupMemberRole(input.groupId, input.userId, input.role);
      return { success: true };
    }),
});

// ─── Friends Router ───────────────────────────────────────────────────────────
const friendsRouter = router({
  send: publicProcedure
    .input(z.object({ requesterId: z.string(), addresseeId: z.string() }))
    .mutation(async ({ input }) => {
      await sendFriendRequest(input.requesterId, input.addresseeId);
      return { success: true };
    }),

  getFriendship: publicProcedure
    .input(z.object({ userId1: z.string(), userId2: z.string() }))
    .query(({ input }) => getFriendship(input.userId1, input.userId2)),

  accept: publicProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ input }) => {
      await updateFriendship(input.friendshipId, "accepted");
      return { success: true };
    }),

  reject: publicProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ input }) => {
      await updateFriendship(input.friendshipId, "rejected");
      return { success: true };
    }),

  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getFriends(input.userId)),

  pending: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getPendingFriendRequests(input.userId)),

  sent: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getSentFriendRequests(input.userId)),
});

// ─── Messages Router ──────────────────────────────────────────────────────────
const messagesRouter = router({
  send: publicProcedure
    .input(z.object({ senderId: z.string(), receiverId: z.string(), content: z.string().min(1).max(5000) }))
    .mutation(async ({ input }) => {
      await sendMessage(input);
      return { success: true };
    }),

  conversation: publicProcedure
    .input(z.object({ userId1: z.string(), userId2: z.string() }))
    .query(({ input }) => getConversation(input.userId1, input.userId2)),

  conversationList: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getConversationList(input.userId)),

  markRead: publicProcedure
    .input(z.object({ senderId: z.string(), receiverId: z.string() }))
    .mutation(async ({ input }) => {
      await markMessagesRead(input.senderId, input.receiverId);
      return { success: true };
    }),
});

// ─── Stats Router ─────────────────────────────────────────────────────────────
const statsRouter = router({
  postsPerMonth: publicProcedure.query(() => getPostsPerMonth()),
  userActivity: publicProcedure.query(() => getUserActivityOverTime()),
  groupPostStats: publicProcedure.query(() => getGroupPostStats()),
  totals: publicProcedure.query(() => getTotalStats()),
});

// ─── Seed Router ──────────────────────────────────────────────────────────────
const seedRouter = router({
  run: publicProcedure.mutation(async () => {
    const { runSeed } = await import("./seed");
    await runSeed();
    return { success: true };
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  users: usersRouter,
  posts: postsRouter,
  groups: groupsRouter,
  friends: friendsRouter,
  messages: messagesRouter,
  stats: statsRouter,
  seed: seedRouter,
});

export type AppRouter = typeof appRouter;
