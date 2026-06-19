import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Heart, MessageCircle, MoreHorizontal, Send, Image, Video,
  ChevronDown, ChevronUp, Trash2, Edit2, Check, X,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import VideoMedia from "../components/VideoMedia";

type PostType = "text" | "image" | "video" | "canvas";

// Media component with state-based error handling
function PostMedia({ imageUrl, videoUrl }: { imageUrl?: string | null; videoUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);

  if (imageUrl && !imgError) {
    return (
      <div className="mb-3 -mx-5 sm:mx-0 rounded-none sm:rounded-xl overflow-hidden">
        <img
          src={imageUrl}
          alt="Post media"
          className="w-full object-cover max-h-72 sm:max-h-80 sm:rounded-xl"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  if (videoUrl) {
    return (
      <VideoMedia
        videoUrl={videoUrl}
        className="mb-3 -mx-5 sm:mx-0"
      />
    );
  }
  if (imageUrl && imgError) {
    return (
      <div className="mb-3 p-3 bg-secondary rounded-xl text-xs text-muted-foreground flex items-center gap-2">
        <span>⚠️</span> Media could not be loaded — check the URL
      </div>
    );
  }
  return null;
}

function PostCard({ post, currentUserId, onRefresh }: { post: any; currentUserId: string | null; onRefresh: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const { data: author } = trpc.users.getById.useQuery({ id: post.authorId }, { staleTime: 300_000, retry: false });
  const { data: comments, refetch: refetchComments } = trpc.posts.getComments.useQuery({ postId: post.id }, { enabled: showComments });
  const { data: isLiked, refetch: refetchLike } = trpc.posts.isLiked.useQuery(
    { postId: post.id, userId: currentUserId! },
    { enabled: !!currentUserId, staleTime: 10_000 }
  );

  const likeMutation = trpc.posts.like.useMutation({ onSuccess: () => { refetchLike(); onRefresh(); } });
  const unlikeMutation = trpc.posts.unlike.useMutation({ onSuccess: () => { refetchLike(); onRefresh(); } });
  const commentMutation = trpc.posts.addComment.useMutation({ onSuccess: () => { setComment(""); refetchComments(); onRefresh(); } });
  const deleteMutation = trpc.posts.delete.useMutation({ onSuccess: () => { toast.success("Post deleted"); onRefresh(); } });
  const updateMutation = trpc.posts.update.useMutation({
    onSuccess: () => { toast.success("Post updated!"); setEditMode(false); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });

  const handleLike = () => {
    if (!currentUserId) return toast.error("Please sign in");
    if (isLiked) unlikeMutation.mutate({ postId: post.id, userId: currentUserId });
    else likeMutation.mutate({ postId: post.id, userId: currentUserId });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !comment.trim()) return;
    commentMutation.mutate({ postId: post.id, authorId: currentUserId, content: comment.trim() });
  };

  return (
    <div className="bg-card border-b border-border sm:border sm:rounded-2xl px-5 py-4 sm:p-5 mb-0 sm:mb-3 transition-shadow hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/profile/${post.authorId}`}>
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src={author?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
              alt=""
              className="sn-avatar flex-shrink-0"
              style={{ width: 40, height: 40 }}
              onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${author?.name || "U"}`; }}
            />
            <div>
              <p className="font-semibold text-sm leading-tight">{author?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Link>
        {currentUserId === post.authorId && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-card border border-border rounded-2xl shadow-xl py-1 z-20 min-w-[140px]">
                <button onClick={() => { setEditMode(true); setEditContent(post.content); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
                  <Edit2 size={14} /> Edit Post
                </button>
                <button onClick={() => { deleteMutation.mutate({ id: post.id }); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {editMode ? (
        <div className="mb-3">
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="sn-input resize-none text-sm w-full" rows={3} autoFocus />
          <div className="flex gap-2 mt-2">
            <button onClick={() => updateMutation.mutate({ id: post.id, content: editContent.trim() })} disabled={updateMutation.isPending} className="sn-btn sn-btn-primary text-xs px-3 py-2 flex items-center gap-1"><Check size={13} /> Save</button>
            <button onClick={() => setEditMode(false)} className="text-xs px-3 py-2 rounded-xl border border-border hover:bg-secondary transition-colors flex items-center gap-1"><X size={13} /> Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Render image/video media when available */}
      <PostMedia imageUrl={post.imageUrl} videoUrl={post.videoUrl} />

      {/* Actions */}
      <div className="flex items-center gap-5 pt-3 border-t border-border">
        <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-all duration-150 ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}>
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          <span className="font-medium">{post.likesCount || 0}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle size={18} />
          <span className="font-medium">{post.commentsCount || 0}</span>
          {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-2">
          {comments?.map((c: any) => <CommentItem key={c.id} comment={c} />)}
          {currentUserId && (
            <form onSubmit={handleComment} className="flex gap-2 mt-3">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment..." className="sn-input flex-1 text-sm py-2" />
              <button type="submit" disabled={!comment.trim()} className="sn-btn sn-btn-primary px-3 py-2"><Send size={14} /></button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: any }) {
  const { data: author } = trpc.users.getById.useQuery({ id: comment.authorId }, { staleTime: 300_000, retry: false });
  return (
    <div className="flex gap-2 items-start">
      <img src={author?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`} alt="" className="sn-avatar flex-shrink-0" style={{ width: 28, height: 28 }} onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${author?.name || "U"}`; }} />
      <div className="flex-1 bg-secondary rounded-xl px-3 py-2">
        <p className="text-xs font-semibold mb-0.5">{author?.name || "User"}</p>
        <p className="text-xs text-muted-foreground">{comment.content}</p>
      </div>
    </div>
  );
}

// Create post with media-aware postType and URL handling
function CreatePost({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const { data: me } = trpc.users.getById.useQuery({ id: userId }, { staleTime: 300_000 });

  const createMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      setContent(""); setMediaUrl(""); setShowMedia(false); setMediaType("image");
      toast.success("Post published!");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Determine postType based on whether media URL is provided
    const hasMedia = showMedia && mediaUrl.trim();
    const postType: PostType = hasMedia ? mediaType : "text";

    createMutation.mutate({
      authorId: userId,
      content: content.trim(),
      postType,
      imageUrl: hasMedia && mediaType === "image" ? mediaUrl.trim() : undefined,
      videoUrl: hasMedia && mediaType === "video" ? mediaUrl.trim() : undefined,
    });
  };

  return (
    <div className="bg-card border-b border-border sm:border sm:rounded-2xl px-4 py-4 sm:p-5 mb-0 sm:mb-3">
      <div className="flex gap-3">
        <img
          src={me?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
          alt=""
          className="sn-avatar flex-shrink-0"
          style={{ width: 40, height: 40 }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${me?.name || "U"}`; }}
        />
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="sn-input resize-none text-sm w-full"
              rows={3}
            />

            {/* Media URL input — shown when Photo or Video is clicked */}
            {showMedia && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaType("image")}
                    className={`flex-1 py-1.5 text-xs rounded-xl border transition-colors ${mediaType === "image" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}
                  >
                    📷 Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("video")}
                    className={`flex-1 py-1.5 text-xs rounded-xl border transition-colors ${mediaType === "video" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}
                  >
                    🎥 Video
                  </button>
                </div>
                <input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={mediaType === "image" ? "Paste image URL (https://...)" : "Paste video URL or YouTube link (https://...)"}
                  className="sn-input text-sm w-full"
                  type="url"
                />
                {mediaUrl && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-green-500">✓</span> URL entered — will be shown in post
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => { setShowMedia(!showMedia); setMediaType("image"); }}
                  className={`flex items-center gap-1 text-xs transition-colors px-2.5 py-2 rounded-xl hover:bg-secondary ${showMedia && mediaType === "image" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                >
                  <Image size={15} />
                  <span className="hidden sm:inline">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMedia(!showMedia); setMediaType("video"); }}
                  className={`flex items-center gap-1 text-xs transition-colors px-2.5 py-2 rounded-xl hover:bg-secondary ${showMedia && mediaType === "video" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                >
                  <Video size={15} />
                  <span className="hidden sm:inline">Video</span>
                </button>
              </div>
              <button
                type="submit"
                disabled={!content.trim() || createMutation.isPending}
                className="sn-btn sn-btn-primary text-sm px-4 py-2"
              >
                {createMutation.isPending ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const { user, loading } = useLocalAuth();

  const { data: feedPosts, isLoading, refetch } = trpc.posts.feed.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id }
  );

  if (!loading && !user) {
    window.location.href = "/login";
    return null;
  }

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto sm:px-4 sm:py-6 lg:py-8">
        <h1 className="text-xl sm:text-2xl font-bold px-4 sm:px-0 py-4 sm:py-0 sm:mb-4" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>
          Your Feed
        </h1>

        {user && <CreatePost userId={user.id} onSuccess={() => refetch()} />}

        {isLoading && (
          <div className="space-y-0 sm:space-y-3 mt-0 sm:mt-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border-b border-border sm:border sm:rounded-2xl p-5">
                <div className="flex gap-3 mb-3">
                  <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/3 rounded" />
                    <div className="skeleton h-3 w-1/4 rounded" />
                  </div>
                </div>
                <div className="skeleton h-16 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && feedPosts?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground px-4">
            <p className="text-4xl mb-4">🌟</p>
            <p className="font-medium mb-2">Your feed is empty</p>
            <p className="text-sm">Follow friends or join groups to see posts here</p>
          </div>
        )}

        <div className="mt-0 sm:mt-3 space-y-0 sm:space-y-3">
          {feedPosts?.map((post: any) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id ?? null} onRefresh={() => refetch()} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
