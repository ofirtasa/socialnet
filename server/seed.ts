import bcrypt from "bcryptjs";
import mongoose from "mongoose";
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
} from "./mongodb";

const DEMO_USERS = [
  { username: "alice", password: "password123", name: "Alice Johnson", email: "alice@example.com", bio: "Photography enthusiast & coffee lover ☕", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice" },
  { username: "bob", password: "password123", name: "Bob Smith", email: "bob@example.com", bio: "Full-stack developer | Open source contributor", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob" },
  { username: "carol", password: "password123", name: "Carol Williams", email: "carol@example.com", bio: "Designer & creative thinker 🎨", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol" },
  { username: "david", password: "password123", name: "David Brown", email: "david@example.com", bio: "Tech entrepreneur | Startup founder", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=david" },
  { username: "emma", password: "password123", name: "Emma Davis", email: "emma@example.com", bio: "Music producer & sound engineer 🎵", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma" },
  { username: "frank", password: "password123", name: "Frank Miller", email: "frank@example.com", bio: "Fitness coach & nutrition expert 💪", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=frank" },
  { username: "grace", password: "password123", name: "Grace Wilson", email: "grace@example.com", bio: "Travel blogger | 40 countries and counting ✈️", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=grace" },
  { username: "henry", password: "password123", name: "Henry Taylor", email: "henry@example.com", bio: "Data scientist | ML enthusiast 🤖", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=henry" },
  { username: "iris", password: "password123", name: "Iris Anderson", email: "iris@example.com", bio: "Chef & food blogger 🍳 | Recipe creator", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=iris" },
  { username: "jack", password: "password123", name: "Jack Thompson", email: "jack@example.com", bio: "Gamer & streamer 🎮 | Esports enthusiast", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jack" },
  { username: "admin", password: "admin123", name: "Admin User", email: "admin@socialnet.com", bio: "Platform administrator", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin", role: "admin" as const },
];

const DEMO_GROUPS = [
  { name: "Tech Enthusiasts", description: "A community for technology lovers, developers, and innovators. Share your projects, discuss trends, and learn together.", isPrivate: false, coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60" },
  { name: "Photography Club", description: "Share your best shots, get feedback, and improve your photography skills. All levels welcome!", isPrivate: false, coverUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60" },
  { name: "Fitness & Health", description: "Your daily dose of motivation, workout tips, and healthy living advice. Let's get fit together!", isPrivate: false, coverUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=60" },
  { name: "Secret Book Club", description: "An exclusive group for serious book lovers. Monthly reading challenges and deep discussions.", isPrivate: true, coverUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop&q=60" },
  { name: "Music Makers", description: "Connect with fellow musicians, share your tracks, collaborate on projects, and discuss music production.", isPrivate: false, coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=60" },
];

const DEMO_POSTS = [
  { content: "Just launched my new open-source project! It's a React component library with 50+ components. Check it out and give it a star ⭐", postType: "text" as const },
  { content: "Golden hour photography is absolutely magical. Spent 3 hours at the beach waiting for this perfect shot. Worth every minute! 📸", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=60" },
  { content: "Morning workout done! 5km run + 100 push-ups. Remember: consistency is key. What's your morning routine? 💪", postType: "text" as const },
  { content: "Just finished reading 'Atomic Habits' for the third time. Every read reveals something new. Highly recommend for anyone looking to build better habits.", postType: "text" as const },
  { content: "New music track dropped! Been working on this beat for 3 weeks. Let me know what you think in the comments 🎵", postType: "video" as const, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { content: "Traveling through Japan has been an incredible experience. The food, culture, and people are absolutely amazing! 🇯🇵✈️", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop&q=60" },
  { content: "Machine learning model achieved 97.3% accuracy on the test set! After weeks of hyperparameter tuning, finally got there. 🤖📊", postType: "text" as const },
  { content: "Homemade pasta from scratch! The secret is in the dough - 00 flour, eggs, and lots of love. Recipe in the comments! 🍝", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=60" },
  { content: "Gaming session highlights! Hit Diamond rank in ranked mode after 200 games. The grind was real but so worth it! 🎮", postType: "text" as const },
  { content: "Design tip of the day: White space is not wasted space. It's breathing room for your content. Less is always more. 🎨", postType: "text" as const },
  { content: "Sunset from my balcony tonight. Sometimes you don't need to travel far to find beauty 🌅", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&auto=format&fit=crop&q=60" },
  { content: "Built a full-stack app in 48 hours for the hackathon. Sleep deprived but proud! We won 2nd place 🏆", postType: "text" as const },
  { content: "Yoga flow for beginners - 20 minute morning routine. Perfect way to start your day with intention and mindfulness 🧘", postType: "video" as const, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { content: "Street photography in NYC. The city never sleeps and there's always a story to capture 📷", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=60" },
  { content: "Data visualization is an art form. Spent the day creating beautiful charts that tell a compelling story. Sharing my D3.js workflow soon!", postType: "text" as const },
  { content: "Avocado toast level: expert 🥑 Added poached eggs, everything bagel seasoning, and a drizzle of hot honey. Breakfast goals!", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=800&auto=format&fit=crop&q=60" },
  { content: "Just crossed the finish line of my first marathon! 42km in 4:23. Couldn't have done it without this community's support! 🏃‍♂️", postType: "text" as const },
  { content: "New ambient music EP is out now! 8 tracks of pure atmospheric soundscapes. Perfect for focus and relaxation 🎶", postType: "text" as const },
  { content: "Exploring ancient temples in Cambodia. History is humbling and these structures are breathtaking 🏛️", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?w=800&auto=format&fit=crop&q=60" },
  { content: "Hot take: TypeScript is not optional for large projects. The type safety alone saves hours of debugging. Change my mind 🔥", postType: "text" as const },
  { content: "Weekend hike to the summit! 2000m elevation, 6 hours, and the most incredible views I've ever seen 🏔️", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=60" },
  { content: "Protein-packed meal prep for the week. 5 containers of chicken, quinoa, and roasted veggies. Eating healthy doesn't have to be boring!", postType: "text" as const },
  { content: "Live coding session recording - building a REST API from scratch in Node.js. Link in bio for the full 2-hour tutorial! 💻", postType: "video" as const, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { content: "Abstract photography challenge: find beauty in everyday objects. This is a coffee cup from above ☕", postType: "image" as const, imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60" },
  { content: "Reading recommendation: 'The Pragmatic Programmer' - still the best book on software craftsmanship after 25 years. A must-read for every developer.", postType: "text" as const },
];

const DEMO_COMMENTS = [
  "This is amazing! 🔥", "Love this content, keep it up!", "Wow, incredible work!",
  "This inspired me to try something new", "Great perspective on this topic",
  "Can't wait to see more from you!", "This made my day better 😊",
  "Absolutely stunning!", "Thanks for sharing this!", "Following for more content like this",
];

const DEMO_MESSAGES = [
  "Hey! How are you doing?", "Just saw your latest post, it was amazing!",
  "We should collaborate on a project sometime", "Thanks for the recommendation!",
  "Are you going to the meetup next week?", "Your photography skills are incredible",
  "I've been working on something similar", "Let's catch up soon!",
];

export async function runSeed() {
  await connectMongoDB();
  console.log("🌱 Starting MongoDB seed...");

  // Optional hard reset for demo-only environments.
  const allowReset = process.env.SEED_RESET === "true";
  if (allowReset) {
    console.warn("⚠️ SEED_RESET=true detected. Existing data will be removed before seeding.");
    await Promise.all([
      UserModel.deleteMany({ loginMethod: "local" }),
      PostModel.deleteMany({}),
      CommentModel.deleteMany({}),
      LikeModel.deleteMany({}),
      GroupModel.deleteMany({}),
      MessageModel.deleteMany({}),
      FriendshipModel.deleteMany({}),
      SessionModel.deleteMany({}),
    ]);
  } else {
    console.log("ℹ️ Non-destructive mode: existing data is preserved.");
  }

  // Create users
  console.log("👥 Creating users...");
  const createdUsers: any[] = [];
  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const daysAgo = Math.floor(Math.random() * 180);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const user = await UserModel.findOneAndUpdate(
      { username: u.username },
      {
        $setOnInsert: {
          username: u.username,
          passwordHash,
          name: u.name,
          email: u.email,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          loginMethod: "local",
          role: (u as any).role || "user",
          createdAt,
          updatedAt: createdAt,
          lastSignedIn: createdAt,
        },
      },
      { new: true, upsert: true }
    );
    createdUsers.push(user);
  }
  console.log(`✅ Upserted ${createdUsers.length} users`);

  // Create groups
  console.log("🏘️ Creating groups...");
  const createdGroups: any[] = [];
  for (let i = 0; i < DEMO_GROUPS.length; i++) {
    const g = DEMO_GROUPS[i];
    const manager = createdUsers[i % 5];
    const memberList: any[] = [{ userId: manager._id, role: "admin", status: "approved", joinedAt: new Date() }];
    // Add 3-6 random members
    const shuffled = [...createdUsers].sort(() => Math.random() - 0.5);
    for (const u of shuffled.slice(0, 5)) {
      if (u._id.toString() !== manager._id.toString()) {
        memberList.push({ userId: u._id, role: "member", status: "approved", joinedAt: new Date() });
      }
    }
    const group = await GroupModel.findOneAndUpdate(
      { name: g.name },
      {
        $setOnInsert: {
          name: g.name,
          description: g.description,
          coverUrl: g.coverUrl,
          isPrivate: g.isPrivate,
          managerId: manager._id,
          members: memberList,
          membersCount: memberList.length,
        },
      },
      { new: true, upsert: true }
    );
    createdGroups.push(group);
  }
  console.log(`✅ Upserted ${createdGroups.length} groups`);

  // Create posts
  console.log("📝 Creating posts...");
  const createdPosts: any[] = [];
  for (let i = 0; i < DEMO_POSTS.length; i++) {
    const p = DEMO_POSTS[i];
    const author = createdUsers[i % createdUsers.length];
    const group = Math.random() > 0.4 ? createdGroups[Math.floor(Math.random() * createdGroups.length)] : null;
    const daysAgo = Math.floor(Math.random() * 120);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const existingPost = await PostModel.findOne({
      authorId: author._id,
      content: p.content,
      postType: p.postType,
    });

    if (existingPost) {
      createdPosts.push(existingPost);
      continue;
    }

    const post = await PostModel.create({
      authorId: author._id,
      groupId: group?._id,
      content: p.content,
      imageUrl: (p as any).imageUrl,
      videoUrl: (p as any).videoUrl,
      postType: p.postType,
      likesCount: Math.floor(Math.random() * 50),
      commentsCount: 0,
      createdAt,
      updatedAt: createdAt,
    });
    createdPosts.push(post);
  }
  console.log(`✅ Ensured ${createdPosts.length} seed posts`);

  // Add likes
  console.log("❤️ Adding likes...");
  for (const post of createdPosts) {
    const likerCount = Math.floor(Math.random() * 8);
    const shuffled = [...createdUsers].sort(() => Math.random() - 0.5).slice(0, likerCount);
    for (const u of shuffled) {
      try {
        await LikeModel.create({ postId: post._id, userId: u._id });
      } catch {}
    }
  }

  // Add comments
  console.log("💬 Adding comments...");
  for (const post of createdPosts) {
    const commentCount = Math.floor(Math.random() * 4);
    for (let c = 0; c < commentCount; c++) {
      const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const content = DEMO_COMMENTS[Math.floor(Math.random() * DEMO_COMMENTS.length)];
      const existingComment = await CommentModel.findOne({ postId: post._id, authorId: author._id, content });
      if (!existingComment) {
        await CommentModel.create({ postId: post._id, authorId: author._id, content });
      }
    }
    // Update comment count
    const count = await CommentModel.countDocuments({ postId: post._id });
    await PostModel.findByIdAndUpdate(post._id, { commentsCount: count });
  }

  // Create friendships
  console.log("🤝 Creating friendships...");
  const friendPairs = [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[0,9],[1,6],[2,7],[3,8]];
  for (const [a, b] of friendPairs) {
    const existingFriendship = await FriendshipModel.findOne({ requesterId: createdUsers[a]._id, addresseeId: createdUsers[b]._id });
    if (!existingFriendship) {
      try {
        await FriendshipModel.create({ requesterId: createdUsers[a]._id, addresseeId: createdUsers[b]._id, status: "accepted" });
      } catch {}
    }
  }
  // Some pending
  const existingPending = await FriendshipModel.findOne({ requesterId: createdUsers[0]._id, addresseeId: createdUsers[5]._id });
  if (!existingPending) {
    try {
      await FriendshipModel.create({ requesterId: createdUsers[0]._id, addresseeId: createdUsers[5]._id, status: "pending" });
    } catch {}
  }

  // Create messages
  console.log("✉️ Creating messages...");
  const msgPairs = [[0,1],[1,2],[2,3],[0,3],[4,5]];
  for (const [a, b] of msgPairs) {
    for (let m = 0; m < 4; m++) {
      const senderId = m % 2 === 0 ? createdUsers[a]._id : createdUsers[b]._id;
      const receiverId = m % 2 === 0 ? createdUsers[b]._id : createdUsers[a]._id;
      const content = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
      const existingMessage = await MessageModel.findOne({ senderId, receiverId, content });
      if (!existingMessage) {
        await MessageModel.create({ senderId, receiverId, content, isRead: true });
      }
    }
  }

  console.log("✅ MongoDB seed complete!");
  return { success: true, users: createdUsers.length, groups: createdGroups.length, posts: createdPosts.length };
}
