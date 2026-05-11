import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Trash2, Users, FileText, Users2, Database, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function AdminPanel() {
  const { user } = useLocalAuth();
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "groups" | "seed">("users");
  const [seeding, setSeeding] = useState(false);

  const { data: allUsers, refetch: refetchUsers } = trpc.users.list.useQuery();
  const { data: allPosts, refetch: refetchPosts } = trpc.posts.search.useQuery({});
  const { data: allGroups, refetch: refetchGroups } = trpc.groups.list.useQuery();

  const deleteUserMutation = trpc.users.delete.useMutation({ onSuccess: () => { toast.success("User deleted"); refetchUsers(); } });
  const deletePostMutation = trpc.posts.delete.useMutation({ onSuccess: () => { toast.success("Post deleted"); refetchPosts(); } });
  const deleteGroupMutation = trpc.groups.delete.useMutation({ onSuccess: () => { toast.success("Group deleted"); refetchGroups(); } });
  const seedMutation = trpc.seed.run.useMutation({
    onSuccess: () => { toast.success("Demo data seeded!"); setSeeding(false); refetchUsers(); refetchPosts(); refetchGroups(); },
    onError: (e) => { toast.error(e.message); setSeeding(false); },
  });

  if (!user || user.role !== "admin") {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="font-medium">Admin access required</p>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: "users" as const, label: "Users", icon: Users, count: allUsers?.length },
    { id: "posts" as const, label: "Posts", icon: FileText, count: allPosts?.length },
    { id: "groups" as const, label: "Groups", icon: Users2, count: allGroups?.length },
    { id: "seed" as const, label: "Seed", icon: Database },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Database size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>Admin Panel</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage all platform data</p>
          </div>
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="flex gap-1 mb-5 border-b border-border overflow-x-auto pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px whitespace-nowrap flex-shrink-0 ${
                activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
              {count !== undefined && <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-2">
            {allUsers?.map((u: any) => (
              <div key={u.id} className="sn-card p-3 sm:p-4 flex items-center gap-3">
                <img
                  src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                  alt=""
                  className="sn-avatar flex-shrink-0"
                  style={{ width: 38, height: 38 }}
                  onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${u.name || "U"}`; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/profile/${u.id}`}>
                      <p className="font-semibold text-sm hover:text-primary cursor-pointer truncate">{u.name}</p>
                    </Link>
                    {u.role === "admin" && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">Admin</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{u.username} · {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</p>
                </div>
                {u.id !== user.id && (
                  <button onClick={() => { if (confirm(`Delete user ${u.name}?`)) deleteUserMutation.mutate({ id: u.id }); }} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="space-y-2">
            {allPosts?.map((p: any) => (
              <div key={p.id} className="sn-card p-3 sm:p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{p.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })} · {p.likesCount} likes</p>
                </div>
                <button onClick={() => { if (confirm("Delete this post?")) deletePostMutation.mutate({ id: p.id }); }} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <div className="space-y-2">
            {allGroups?.map((g: any) => (
              <div key={g.id} className="sn-card p-3 sm:p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                  {g.coverUrl ? <img src={g.coverUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}>{g.name[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/groups/${g.id}`}><p className="font-semibold text-sm hover:text-primary cursor-pointer truncate">{g.name}</p></Link>
                  <p className="text-xs text-muted-foreground">{g.isPrivate ? "Private" : "Public"} · {g.membersCount} members</p>
                </div>
                <button onClick={() => { if (confirm(`Delete "${g.name}"?`)) deleteGroupMutation.mutate({ id: g.id }); }} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Seed Tab */}
        {activeTab === "seed" && (
          <div className="max-w-lg">
            <div className="sn-card p-5 sm:p-6">
              <div className="text-center mb-5">
                <div className="text-4xl sm:text-5xl mb-3">🌱</div>
                <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>Seed Demo Data</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Populate MongoDB with 11 users, 5 groups, 25 posts, friendships, and messages. This will clear existing demo data.
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 mb-5 text-sm space-y-1.5">
                <p>✅ 11 demo users (alice, bob, carol...)</p>
                <p>✅ 5 groups (Tech, Photography, Fitness...)</p>
                <p>✅ 25 posts with images and videos</p>
                <p>✅ Friendships, likes, comments, messages</p>
              </div>
              <button
                onClick={() => { setSeeding(true); seedMutation.mutate(); }}
                disabled={seeding || seedMutation.isPending}
                className="sn-btn sn-btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {seeding ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Seeding...</>
                ) : (
                  <><RefreshCw size={16} /> Run Seed</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
