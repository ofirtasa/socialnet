import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Check, X, MessageCircle, UserPlus } from "lucide-react";
import { Link } from "wouter";

export default function Friends() {
  const { user } = useLocalAuth();

  const { data: friends, refetch: refetchFriends } = trpc.friends.list.useQuery(
    { userId: user?.id ?? "" }, { enabled: !!user }
  );
  const { data: pending, refetch: refetchPending } = trpc.friends.pending.useQuery(
    { userId: user?.id ?? "" }, { enabled: !!user }
  );
  const { data: sent } = trpc.friends.sent.useQuery(
    { userId: user?.id ?? "" }, { enabled: !!user }
  );
  const { data: allUsers } = trpc.users.list.useQuery();

  const acceptMutation = trpc.friends.accept.useMutation({
    onSuccess: () => { toast.success("Friend added!"); refetchFriends(); refetchPending(); },
  });
  const rejectMutation = trpc.friends.reject.useMutation({
    onSuccess: () => { toast.success("Request rejected"); refetchPending(); },
  });

  if (!user) return (
    <Layout>
      <div className="flex items-center justify-center h-64 text-muted-foreground">Please sign in</div>
    </Layout>
  );

  const friendUserIds = new Set([
    ...(friends?.map((f: any) => String(f.requesterId) === user.id ? String(f.addresseeId) : String(f.requesterId)) || []),
    ...(sent?.map((f: any) => String(f.addresseeId)) || []),
    ...(pending?.map((f: any) => String(f.requesterId)) || []),
    user.id,
  ]);

  const suggestions = allUsers?.filter((u: any) => !friendUserIds.has(String(u.id))).slice(0, 6) || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-5" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>Friends</h1>

        {/* Friend Requests */}
        {pending && pending.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
              Friend Requests
              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{pending.length}</span>
            </h2>
            <div className="space-y-2">
              {pending.map((req: any) => (
                <FriendRequestCard
                  key={req.id}
                  request={req}
                  onAccept={() => acceptMutation.mutate({ friendshipId: String(req.id) })}
                  onReject={() => rejectMutation.mutate({ friendshipId: String(req.id) })}
                />
              ))}
            </div>
          </section>
        )}

        {/* Your Friends */}
        <section className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3">Your Friends ({friends?.length || 0})</h2>
          {friends?.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No friends yet. Send some requests!</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {friends?.map((f: any) => {
              const friendId = String(f.requesterId) === user.id ? String(f.addresseeId) : String(f.requesterId);
              return <FriendCard key={f.id} userId={friendId} />;
            })}
          </div>
        </section>

        {/* People You May Know */}
        {suggestions.length > 0 && (
          <section>
            <h2 className="text-base sm:text-lg font-semibold mb-3">People You May Know</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {suggestions.map((u: any) => (
                <SuggestionCard key={u.id} user={u} currentUserId={user.id} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

function FriendRequestCard({ request, onAccept, onReject }: { request: any; onAccept: () => void; onReject: () => void }) {
  const { data: requester } = trpc.users.getById.useQuery({ id: String(request.requesterId) }, { staleTime: 300_000 });
  return (
    <div className="sn-card p-3 sm:p-4 flex items-center gap-3">
      <Link href={`/profile/${request.requesterId}`}>
        <img
          src={requester?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.requesterId}`}
          alt=""
          className="sn-avatar cursor-pointer flex-shrink-0"
          style={{ width: 44, height: 44 }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${requester?.name || "U"}`; }}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{requester?.name || "User"}</p>
        <p className="text-xs text-muted-foreground">@{requester?.username}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onAccept} className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity">
          <Check size={16} />
        </button>
        <button onClick={onReject} className="w-9 h-9 rounded-xl border border-border hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function FriendCard({ userId }: { userId: string }) {
  const { data: user } = trpc.users.getById.useQuery({ id: userId }, { staleTime: 300_000 });
  if (!user) return null;
  return (
    <div className="sn-card p-3 sm:p-4 flex items-center gap-3">
      <Link href={`/profile/${userId}`}>
        <img
          src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
          alt=""
          className="sn-avatar cursor-pointer flex-shrink-0"
          style={{ width: 44, height: 44 }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || "U"}`; }}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
      </div>
      <Link href={`/chat/${userId}`}>
        <button className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-primary flex-shrink-0">
          <MessageCircle size={16} />
        </button>
      </Link>
    </div>
  );
}

function SuggestionCard({ user, currentUserId }: { user: any; currentUserId: string }) {
  const sendMutation = trpc.friends.send.useMutation({
    onSuccess: () => toast.success("Request sent!"),
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="sn-card p-3 sm:p-4 text-center">
      <Link href={`/profile/${user.id}`}>
        <img
          src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
          alt=""
          className="sn-avatar mx-auto mb-2 cursor-pointer"
          style={{ width: 52, height: 52 }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || "U"}`; }}
        />
      </Link>
      <p className="font-semibold text-sm truncate">{user.name}</p>
      <p className="text-xs text-muted-foreground mb-3 truncate">@{user.username}</p>
      <button
        onClick={() => sendMutation.mutate({ requesterId: currentUserId, addresseeId: String(user.id) })}
        disabled={sendMutation.isPending || sendMutation.isSuccess}
        className="sn-btn sn-btn-primary text-xs px-3 py-2 w-full flex items-center justify-center gap-1"
      >
        {sendMutation.isSuccess ? "Sent ✓" : <><UserPlus size={12} /> Add</>}
      </button>
    </div>
  );
}
