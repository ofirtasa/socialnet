import { useRef, useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Camera, Edit2, UserPlus, UserCheck, MessageCircle, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

// ─── Canvas Avatar Editor ─────────────────────────────────────────────────────
function CanvasAvatarEditor({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#6366f1");
  const [size, setSize] = useState(8);
  const [tool, setTool] = useState<"pen" | "fill" | "eraser">("pen");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, 150, 150);
    grad.addColorStop(0, "#6366f1");
    grad.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 150, 150);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 80px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S", 75, 78);
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
    if (tool === "fill") {
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 150, 150);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!drawing || tool === "fill") return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? size * 2 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => setDrawing(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-card rounded-t-3xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-2xl">
        <h3 className="font-semibold mb-4 text-center">Canvas Avatar Editor</h3>
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            width={150}
            height={150}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            style={{ borderRadius: "50%", cursor: "crosshair", border: "3px solid oklch(0.55 0.22 264)", width: 150, height: 150, touchAction: "none" }}
          />
          <div className="flex gap-2 w-full">
            {(["pen", "fill", "eraser"] as const).map((t) => (
              <button key={t} onClick={() => setTool(t)} className={`flex-1 py-2 text-xs rounded-xl capitalize transition-all ${tool === t ? "bg-primary text-white" : "bg-secondary hover:bg-border"}`}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full">
            <label className="text-xs text-muted-foreground">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0" />
            <label className="text-xs text-muted-foreground">Size: {size}px</label>
            <input type="range" min={2} max={30} value={size} onChange={(e) => setSize(Number(e.target.value))} className="flex-1" />
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm">Cancel</button>
            <button onClick={() => { onSave(canvasRef.current!.toDataURL("image/png")); toast.success("Avatar saved!"); }} className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity text-sm">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const params = useParams<{ id: string }>();
  const userId = params.id || "";
  const { user: currentUser, refetch: refetchAuth } = useLocalAuth();
  const [editMode, setEditMode] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", avatarUrl: "" });

  const { data: profile, refetch } = trpc.users.getById.useQuery({ id: userId }, { enabled: !!userId });
  const { data: posts } = trpc.posts.byAuthor.useQuery({ authorId: userId }, { enabled: !!userId });
  const { data: friendship } = trpc.friends.getFriendship.useQuery(
    { userId1: currentUser?.id ?? "", userId2: userId },
    { enabled: !!currentUser && currentUser.id !== userId }
  );

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => { toast.success("Profile updated!"); refetch(); refetchAuth(); setEditMode(false); },
    onError: (e) => toast.error(e.message),
  });
  const sendFriendMutation = trpc.friends.send.useMutation({
    onSuccess: () => toast.success("Friend request sent!"),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (profile) setEditForm({ name: profile.name || "", bio: profile.bio || "", avatarUrl: profile.avatarUrl || "" });
  }, [profile]);

  const isOwnProfile = currentUser?.id === userId && !!userId;
  const friendStatus = friendship?.status;

  if (!profile) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        {/* Profile Header */}
        <div className="sn-card p-4 sm:p-6 mb-5 fade-in">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={editForm.avatarUrl || profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                alt={profile.name || ""}
                className="sn-avatar"
                style={{ width: 72, height: 72 }}
                onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || "U"}`; }}
              />
              {isOwnProfile && (
                <button
                  onClick={() => setShowCanvas(true)}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-md"
                >
                  <Camera size={11} />
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editMode ? (
                <div className="space-y-2">
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="sn-input text-sm font-semibold" placeholder="Your name" />
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="sn-input text-sm resize-none" rows={2} placeholder="Bio..." />
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: userId, ...editForm })} className="sn-btn sn-btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><Check size={13} /> Save</button>
                    <button onClick={() => setEditMode(false)} className="text-xs px-3 py-1.5 rounded-xl border border-border hover:bg-secondary transition-colors flex items-center gap-1"><X size={13} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold">{profile.name}</h1>
                    {profile.role === "admin" && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  {profile.bio && <p className="text-sm mt-1.5 leading-relaxed text-foreground/80">{profile.bio}</p>}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {!editMode && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {isOwnProfile && (
                <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                  <Edit2 size={14} /> Edit Profile
                </button>
              )}
              {!isOwnProfile && currentUser && (
                <>
                  {!friendStatus && (
                    <button onClick={() => sendFriendMutation.mutate({ requesterId: currentUser.id, addresseeId: userId })} className="sn-btn sn-btn-primary text-sm px-3 py-2 flex items-center gap-1.5">
                      <UserPlus size={14} /> Add Friend
                    </button>
                  )}
                  {friendStatus === "pending" && (
                    <span className="text-xs px-3 py-2 rounded-xl bg-secondary text-muted-foreground">Request Pending</span>
                  )}
                  {friendStatus === "accepted" && (
                    <span className="text-xs px-3 py-2 rounded-xl bg-green-50 text-green-600 flex items-center gap-1 dark:bg-green-900/20 dark:text-green-400">
                      <UserCheck size={13} /> Friends
                    </span>
                  )}
                  <Link href={`/chat/${userId}`}>
                    <button className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                      <MessageCircle size={14} /> Message
                    </button>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xl font-bold">{posts?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
        </div>

        {/* Canvas Editor Modal */}
        {showCanvas && isOwnProfile && (
          <CanvasAvatarEditor
            onSave={(dataUrl) => { setEditForm((f) => ({ ...f, avatarUrl: dataUrl })); setShowCanvas(false); }}
            onCancel={() => setShowCanvas(false)}
          />
        )}

        {/* Posts */}
        <h2 className="text-base sm:text-lg font-semibold mb-3">Posts</h2>
        {posts?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-sm">No posts yet</p>
          </div>
        )}
        <div className="space-y-3">
          {posts?.map((post: any) => (
            <div key={post.id} className="sn-card p-4 fade-in">
              <p className="text-sm leading-relaxed mb-2">{post.content}</p>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="" className="w-full rounded-xl max-h-60 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              )}
              {post.videoUrl && (
                <video src={post.videoUrl} controls playsInline className="w-full rounded-xl max-h-60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} · {post.likesCount} likes · {post.commentsCount} comments
              </p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
