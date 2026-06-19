import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import VideoMedia from "../components/VideoMedia";
import { toast } from "sonner";
import { Users, Lock, Globe, Check, X, Settings, Shield, UserMinus, Crown, ChevronDown, ChevronUp, Image, Video, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

// ─── Create Post in Group ─────────────────────────────────────────────────────
function GroupCreatePost({ userId, groupId, onSuccess }: { userId: string; groupId: string; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "image" | "video">("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const { data: me } = trpc.users.getById.useQuery({ id: userId }, { staleTime: 300_000 });

  const createMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      setContent(""); setMediaUrl(""); setShowMedia(false); setPostType("text");
      toast.success("Post published!");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate({
      authorId: userId,
      groupId,
      content: content.trim(),
      postType,
      imageUrl: postType === "image" && mediaUrl.trim() ? mediaUrl.trim() : undefined,
      videoUrl: postType === "video" && mediaUrl.trim() ? mediaUrl.trim() : undefined,
    });
  };

  return (
    <div className="sn-card p-4 mb-4">
      <div className="flex gap-3">
        <img
          src={me?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
          alt=""
          className="sn-avatar flex-shrink-0"
          style={{ width: 38, height: 38 }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${me?.name || "U"}`; }}
        />
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something in this group..."
              className="sn-input resize-none text-sm w-full"
              rows={2}
            />
            {showMedia && (
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as "image" | "video")}
                  className="sn-input text-sm"
                  style={{ width: "auto", minWidth: 100 }}
                >
                  <option value="image">Image URL</option>
                  <option value="video">Video URL</option>
                </select>
                <input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={postType === "video" ? "Paste video URL or YouTube link..." : "Paste image URL here..."}
                  className="sn-input flex-1 text-sm"
                />
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => { setShowMedia(true); setPostType("image"); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary"
                >
                  <Image size={14} /> <span className="hidden sm:inline">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMedia(true); setPostType("video"); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary"
                >
                  <Video size={14} /> <span className="hidden sm:inline">Video</span>
                </button>
              </div>
              <button
                type="submit"
                disabled={!content.trim() || createMutation.isPending}
                className="sn-btn sn-btn-primary text-xs px-4 py-2"
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

// Cover image with fallback
function GroupCover({ coverUrl, name }: { coverUrl?: string | null; name: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (coverUrl && !imgFailed) {
    return (
      <img
        src={coverUrl}
        alt={name}
        className="w-full h-40 sm:h-52 object-cover"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div
      className="w-full h-40 sm:h-52 flex items-center justify-center text-white text-6xl font-bold"
      style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}
    >
      {name[0]}
    </div>
  );
}

export default function GroupDetail() {
  const params = useParams<{ id: string }>();
  const groupId = params.id || "";
  const { user } = useLocalAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", isPrivate: false });

  const { data: group, refetch } = trpc.groups.getById.useQuery({ id: groupId }, { enabled: !!groupId });
  const { data: posts, refetch: refetchPosts } = trpc.posts.byGroup.useQuery({ groupId }, { enabled: !!groupId });
  const { data: membership } = trpc.groups.membership.useQuery({ groupId, userId: user?.id ?? "" }, { enabled: !!user });
  const { data: pendingRequests } = trpc.groups.pendingRequests.useQuery(
    { groupId },
    { enabled: !!group && (group.managerId === user?.id || membership?.role === "admin") }
  );
  const { data: allMembers } = trpc.groups.members.useQuery({ groupId }, { enabled: !!groupId });

  const joinMutation = trpc.groups.join.useMutation({ onSuccess: (d) => { toast.success(d.pending ? "Request sent!" : "Joined!"); refetch(); } });
  const leaveMutation = trpc.groups.leave.useMutation({ onSuccess: () => { toast.success("Left group"); refetch(); } });
  const approveMutation = trpc.groups.approve.useMutation({ onSuccess: () => { toast.success("Approved!"); refetch(); } });
  const rejectMutation = trpc.groups.reject.useMutation({ onSuccess: () => { toast.success("Rejected"); refetch(); } });
  const updateMutation = trpc.groups.update.useMutation({ onSuccess: () => { toast.success("Group updated!"); refetch(); setShowEdit(false); } });
  const deleteMutation = trpc.groups.delete.useMutation({ onSuccess: () => { toast.success("Group deleted"); window.location.href = "/groups"; } });

  const isMember = membership?.status === "approved";
  const isPending = membership?.status === "pending";
  const isManager = group?.managerId === user?.id;
  const isAdmin = isManager || membership?.role === "admin";
  const canPost = isMember || isAdmin;

  if (!group) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Group cover */}
        <div className="relative">
          <GroupCover coverUrl={group.coverUrl} name={group.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4 text-white">
            <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{group.name}</h1>
            <div className="flex items-center gap-2 text-sm text-white/80 mt-0.5">
              {group.isPrivate ? <Lock size={12} /> : <Globe size={12} />}
              {group.isPrivate ? "Private" : "Public"} · <Users size={12} /> {group.membersCount}
            </div>
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            {isAdmin && (
              <button onClick={() => { setEditForm({ name: group.name, description: group.description || "", isPrivate: group.isPrivate }); setShowEdit(true); }} className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 hover:bg-white/30 transition-colors">
                <Settings size={13} /> <span className="hidden sm:inline">Manage</span>
              </button>
            )}
            {user && !isAdmin && (
              isMember ? (
                <button onClick={() => leaveMutation.mutate({ groupId, userId: user.id })} className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm hover:bg-white/30 transition-colors">Leave</button>
              ) : isPending ? (
                <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm">Pending</span>
              ) : (
                <button onClick={() => joinMutation.mutate({ groupId, userId: user.id })} className="bg-white text-primary px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-white/90 transition-colors">Join</button>
              )
            )}
          </div>
        </div>

        <div className="px-4 py-4 sm:py-6">
          {group.description && (
            <div className="sn-card p-4 mb-4">
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Posts and create form for members/admins */}
            <div className="lg:col-span-2">
              {canPost && user && (
                <GroupCreatePost userId={user.id} groupId={groupId} onSuccess={() => refetchPosts()} />
              )}
              {!canPost && !user && (
                <div className="sn-card p-4 mb-4 text-center text-sm text-muted-foreground">
                  Join this group to post
                </div>
              )}

              <h2 className="text-base sm:text-lg font-semibold mb-3">Posts</h2>
              {posts?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-sm">No posts yet{canPost ? " — be the first!" : ""}</p>
                </div>
              )}
              <div className="space-y-3">
                {posts?.map((post: any) => (
                  <GroupPostCard key={post.id} post={post} currentUserId={user?.id ?? null} onRefresh={refetchPosts} />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Pending requests */}
              {isAdmin && pendingRequests && pendingRequests.length > 0 && (
                <div className="sn-card p-4">
                  <h3 className="font-semibold text-sm mb-3">Join Requests ({pendingRequests.length})</h3>
                  <div className="space-y-2">
                    {pendingRequests.map((req: any) => (
                      <div key={req.userId} className="flex items-center justify-between gap-2">
                        <Link href={`/profile/${req.userId}`}>
                          <span className="text-sm text-primary hover:underline cursor-pointer truncate">User</span>
                        </Link>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => approveMutation.mutate({ groupId, userId: String(req.userId) })} className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors dark:bg-green-900/20"><Check size={13} /></button>
                          <button onClick={() => rejectMutation.mutate({ groupId, userId: String(req.userId) })} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors dark:bg-red-900/20"><X size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              <div className="sn-card p-4">
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="w-full flex items-center justify-between font-semibold text-sm mb-2"
                >
                  <span>Members ({allMembers?.filter((m: any) => m.status === "approved").length || 0})</span>
                  {showMembers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showMembers && (
                  <div className="space-y-2 mt-2">
                    {allMembers?.filter((m: any) => m.status === "approved").map((m: any) => (
                      <MemberItem key={m.userId} member={m} groupId={groupId} isAdmin={isAdmin} currentUserId={user?.id} managerId={group.managerId} onRefresh={refetch} />
                    ))}
                  </div>
                )}
              </div>

              {/* Danger zone */}
              {isManager && (
                <div className="sn-card p-4">
                  <h3 className="font-semibold text-sm mb-3 text-destructive">Danger Zone</h3>
                  <button
                    onClick={() => { if (confirm(`Delete group "${group.name}"?`)) deleteMutation.mutate({ id: groupId }); }}
                    className="w-full text-sm py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Delete Group
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-card rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-5">Edit Group</h2>
              <div className="space-y-4">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="sn-input" placeholder="Group name" />
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="sn-input resize-none" rows={3} placeholder="Description" />
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={editForm.isPrivate} onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">Private group</span>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowEdit(false)} className="flex-1 py-3 rounded-xl border border-border hover:bg-secondary transition-colors text-sm">Cancel</button>
                <button onClick={() => updateMutation.mutate({ id: groupId, ...editForm })} className="flex-1 sn-btn sn-btn-primary text-sm py-3">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ─── Group Post Card ──────────────────────────────────────────────────────────
function GroupPostCard({ post, currentUserId, onRefresh }: { post: any; currentUserId: string | null; onRefresh: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const { data: author } = trpc.users.getById.useQuery({ id: post.authorId }, { staleTime: 300_000, retry: false });
  const deleteMutation = trpc.posts.delete.useMutation({ onSuccess: () => { toast.success("Post deleted"); onRefresh(); } });

  return (
    <div className="sn-card p-4 fade-in">
      <div className="flex items-start justify-between mb-2">
        <Link href={`/profile/${post.authorId}`}>
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              src={author?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
              alt=""
              className="sn-avatar"
              style={{ width: 32, height: 32 }}
              onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${author?.name || "U"}`; }}
            />
            <div>
              <p className="text-xs font-semibold">{author?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
        </Link>
        {currentUserId === post.authorId && (
          <button onClick={() => { if (confirm("Delete this post?")) deleteMutation.mutate({ id: post.id }); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed mb-2">{post.content}</p>
      {post.imageUrl && !imgFailed && (
        <img src={post.imageUrl} alt="" className="w-full rounded-xl max-h-60 object-cover" onError={() => setImgFailed(true)} />
      )}
      {post.videoUrl && (
        <VideoMedia videoUrl={post.videoUrl} className="mt-2" />
      )}
      <p className="text-xs text-muted-foreground mt-2">{post.likesCount} likes · {post.commentsCount} comments</p>
    </div>
  );
}

function MemberItem({ member, groupId, isAdmin, currentUserId, managerId, onRefresh }: {
  member: any; groupId: string; isAdmin: boolean; currentUserId?: string; managerId: string; onRefresh: () => void;
}) {
  const { data: user } = trpc.users.getById.useQuery({ id: String(member.userId) }, { staleTime: 300_000 });
  const removeMutation = trpc.groups.removeMember.useMutation({ onSuccess: () => { toast.success("Member removed"); onRefresh(); } });
  const setRoleMutation = trpc.groups.setMemberRole.useMutation({ onSuccess: () => { toast.success("Role updated!"); onRefresh(); } });

  const isOwner = String(member.userId) === managerId;
  const canManage = isAdmin && !isOwner && String(member.userId) !== currentUserId;

  return (
    <div className="flex items-center gap-2">
      <Link href={`/profile/${member.userId}`}>
        <img
          src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
          alt=""
          className="sn-avatar cursor-pointer flex-shrink-0"
          style={{ width: 28, height: 28 }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "U"}`; }}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{user?.name || "User"}</p>
        <div className="flex items-center gap-1">
          {isOwner && <span className="text-xs text-primary flex items-center gap-0.5"><Crown size={9} /> Owner</span>}
          {!isOwner && member.role === "admin" && <span className="text-xs text-amber-600 flex items-center gap-0.5 dark:text-amber-400"><Shield size={9} /> Admin</span>}
          {!isOwner && member.role === "member" && <span className="text-xs text-muted-foreground">Member</span>}
        </div>
      </div>
      {canManage && (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setRoleMutation.mutate({ groupId, userId: String(member.userId), role: member.role === "admin" ? "member" : "admin" })} title={member.role === "admin" ? "Demote" : "Promote"} className="w-6 h-6 rounded-lg bg-secondary hover:bg-border flex items-center justify-center transition-colors">
            <Shield size={11} />
          </button>
          <button onClick={() => { if (confirm("Remove this member?")) removeMutation.mutate({ groupId, userId: String(member.userId) }); }} className="w-6 h-6 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors dark:bg-red-900/20">
            <UserMinus size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
