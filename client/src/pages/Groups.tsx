import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Plus, Lock, Globe, Users } from "lucide-react";
import { Link } from "wouter";

function CreateGroupModal({ userId, onClose, onSuccess }: { userId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", isPrivate: false, coverUrl: "" });
  const createMutation = trpc.groups.create.useMutation({
    onSuccess: () => { toast.success("Group created!"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-card rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>Create Group</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Group Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="sn-input" placeholder="Enter group name" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sn-input resize-none" rows={3} placeholder="What is this group about?" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Cover Image URL</label>
            <input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} className="sn-input" placeholder="https://..." />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-sm">Private group (requires approval to join)</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium">Cancel</button>
          <button
            onClick={() => createMutation.mutate({ ...form, managerId: userId })}
            disabled={!form.name.trim() || createMutation.isPending}
            className="flex-1 sn-btn sn-btn-primary text-sm py-3"
          >
            {createMutation.isPending ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Groups() {
  const { user } = useLocalAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const { data: allGroups, refetch } = trpc.groups.publicList.useQuery();
  const { data: myGroups } = trpc.groups.userGroups.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id }
  );

  const filtered = allGroups?.filter((g: any) => g.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>Groups</h1>
          {user && (
            <button onClick={() => setShowCreate(true)} className="sn-btn sn-btn-primary text-sm flex items-center gap-1.5 px-3 py-2">
              <Plus size={16} />
              <span className="hidden sm:inline">Create Group</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="sn-input mb-5"
        />

        {myGroups && myGroups.length > 0 && (
          <div className="mb-7">
            <h2 className="text-base sm:text-lg font-semibold mb-3">Your Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myGroups.map((g: any) => <GroupCard key={g.id} group={g} userId={user?.id} onRefresh={refetch} />)}
            </div>
          </div>
        )}

        <h2 className="text-base sm:text-lg font-semibold mb-3">Discover Groups</h2>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-3xl mb-3">👥</p>
            <p>No groups found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((g: any) => <GroupCard key={g.id} group={g} userId={user?.id} onRefresh={refetch} />)}
          </div>
        )}

        {showCreate && user && (
          <CreateGroupModal userId={user.id} onClose={() => setShowCreate(false)} onSuccess={refetch} />
        )}
      </div>
    </Layout>
  );
}

function GroupCard({ group, userId, onRefresh }: { group: any; userId?: string; onRefresh: () => void }) {
  const { data: membership } = trpc.groups.membership.useQuery(
    { groupId: String(group.id), userId: userId ?? "" },
    { enabled: !!userId }
  );
  const joinMutation = trpc.groups.join.useMutation({
    onSuccess: (d) => { toast.success(d.pending ? "Request sent!" : "Joined!"); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const leaveMutation = trpc.groups.leave.useMutation({
    onSuccess: () => { toast.success("Left group"); onRefresh(); },
  });

  const isMember = membership?.status === "approved";
  const isPending = membership?.status === "pending";

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="sn-card overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
        {group.coverUrl ? (
          <img
            src={group.coverUrl}
            alt=""
            className="w-full h-28 sm:h-32 object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-28 sm:h-32 flex items-center justify-center text-white text-4xl font-bold" style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}>
            {group.name[0]}
          </div>
        )}
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{group.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                {group.isPrivate ? <Lock size={10} /> : <Globe size={10} />}
                {group.isPrivate ? "Private" : "Public"}
                <span>·</span>
                <Users size={10} />
                {group.membersCount}
              </div>
            </div>
            {userId && (
              <div onClick={(e) => e.preventDefault()} className="flex-shrink-0">
                {isMember ? (
                  <button onClick={() => leaveMutation.mutate({ groupId: String(group.id), userId })} className="text-xs px-2.5 py-1.5 rounded-xl border border-border hover:bg-destructive/10 hover:text-destructive transition-all">Leave</button>
                ) : isPending ? (
                  <span className="text-xs px-2.5 py-1.5 rounded-xl bg-secondary text-muted-foreground">Pending</span>
                ) : (
                  <button onClick={() => joinMutation.mutate({ groupId: String(group.id), userId })} className="sn-btn sn-btn-primary text-xs px-2.5 py-1.5">Join</button>
                )}
              </div>
            )}
          </div>
          {group.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{group.description}</p>}
        </div>
      </div>
    </Link>
  );
}
