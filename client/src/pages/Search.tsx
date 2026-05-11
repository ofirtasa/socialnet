import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Search as SearchIcon, Users, FileText } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

type SearchTab = "posts" | "users";

export default function Search() {
  const [tab, setTab] = useState<SearchTab>("posts");
  const [postParams, setPostParams] = useState({ keyword: "", groupId: "", postType: "", dateFrom: "", dateTo: "" });
  const [postSearchActive, setPostSearchActive] = useState(false);
  const [userParams, setUserParams] = useState({ name: "", role: "", joinedAfter: "", joinedBefore: "" });
  const [userSearchActive, setUserSearchActive] = useState(false);

  const { data: postResults, isLoading: postsLoading } = trpc.posts.search.useQuery(
    {
      keyword: postParams.keyword || undefined,
      groupId: postParams.groupId || undefined,
      postType: postParams.postType || undefined,
      dateFrom: postParams.dateFrom || undefined,
      dateTo: postParams.dateTo || undefined,
    },
    { enabled: postSearchActive }
  );

  const { data: userResults, isLoading: usersLoading } = trpc.users.search.useQuery(
    {
      name: userParams.name || undefined,
      role: userParams.role || undefined,
      joinedAfter: userParams.joinedAfter || undefined,
      joinedBefore: userParams.joinedBefore || undefined,
    },
    { enabled: userSearchActive }
  );

  const handlePostSearch = (e: React.FormEvent) => { e.preventDefault(); setPostSearchActive(true); };
  const handleUserSearch = (e: React.FormEvent) => { e.preventDefault(); setUserSearchActive(true); };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-5" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>
          Advanced Search
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 bg-secondary rounded-xl w-fit">
          {(["posts", "users"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "posts" ? (
                <span className="flex items-center gap-1.5"><FileText size={14} />Posts</span>
              ) : (
                <span className="flex items-center gap-1.5"><Users size={14} />Users</span>
              )}
            </button>
          ))}
        </div>

        {/* Post Search */}
        {tab === "posts" && (
          <div>
            <div className="sn-card p-4 sm:p-6 mb-5">
              <h2 className="font-semibold mb-4 text-sm">Search Posts</h2>
              <form onSubmit={handlePostSearch} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Keyword</label>
                    <input value={postParams.keyword} onChange={(e) => setPostParams({ ...postParams, keyword: e.target.value })} placeholder="Search in content..." className="sn-input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Post Type</label>
                    <select value={postParams.postType} onChange={(e) => setPostParams({ ...postParams, postType: e.target.value })} className="sn-input text-sm">
                      <option value="">All types</option>
                      <option value="text">Text</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Group ID</label>
                    <input value={postParams.groupId} onChange={(e) => setPostParams({ ...postParams, groupId: e.target.value })} placeholder="Enter group ID..." className="sn-input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From Date</label>
                    <input type="date" value={postParams.dateFrom} onChange={(e) => setPostParams({ ...postParams, dateFrom: e.target.value })} className="sn-input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To Date</label>
                    <input type="date" value={postParams.dateTo} onChange={(e) => setPostParams({ ...postParams, dateTo: e.target.value })} className="sn-input text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="sn-btn sn-btn-primary text-sm flex items-center gap-2 flex-1 sm:flex-none justify-center">
                    <SearchIcon size={15} /> Search Posts
                  </button>
                  <button type="button" onClick={() => { setPostParams({ keyword: "", groupId: "", postType: "", dateFrom: "", dateTo: "" }); setPostSearchActive(false); }} className="text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {postsLoading && <div className="text-center py-8 text-muted-foreground">Searching...</div>}
            {postResults && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">{postResults.length} result{postResults.length !== 1 ? "s" : ""} found</p>
                <div className="space-y-3">
                  {postResults.map((post: any) => (
                    <div key={post.id} className="sn-card p-4 fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          post.postType === "video" ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20" :
                          post.postType === "image" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" :
                          "bg-secondary text-muted-foreground"
                        }`}>{post.postType}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-3">{post.content}</p>
                      {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full rounded-xl mt-2 max-h-40 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span>❤️ {post.likesCount}</span>
                        <span>💬 {post.commentsCount}</span>
                      </div>
                    </div>
                  ))}
                  {postResults.length === 0 && postSearchActive && (
                    <div className="text-center py-12 text-muted-foreground">
                      <SearchIcon size={32} className="mx-auto mb-3 opacity-20" />
                      <p>No posts found matching your criteria</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Search */}
        {tab === "users" && (
          <div>
            <div className="sn-card p-4 sm:p-6 mb-5">
              <h2 className="font-semibold mb-4 text-sm">Search Users</h2>
              <form onSubmit={handleUserSearch} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                    <input value={userParams.name} onChange={(e) => setUserParams({ ...userParams, name: e.target.value })} placeholder="Search by name..." className="sn-input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
                    <select value={userParams.role} onChange={(e) => setUserParams({ ...userParams, role: e.target.value })} className="sn-input text-sm">
                      <option value="">All roles</option>
                      <option value="user">Regular User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Joined After</label>
                    <input type="date" value={userParams.joinedAfter} onChange={(e) => setUserParams({ ...userParams, joinedAfter: e.target.value })} className="sn-input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Joined Before</label>
                    <input type="date" value={userParams.joinedBefore} onChange={(e) => setUserParams({ ...userParams, joinedBefore: e.target.value })} className="sn-input text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="sn-btn sn-btn-primary text-sm flex items-center gap-2 flex-1 sm:flex-none justify-center">
                    <SearchIcon size={15} /> Search Users
                  </button>
                  <button type="button" onClick={() => { setUserParams({ name: "", role: "", joinedAfter: "", joinedBefore: "" }); setUserSearchActive(false); }} className="text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {usersLoading && <div className="text-center py-8 text-muted-foreground">Searching...</div>}
            {userResults && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">{userResults.length} result{userResults.length !== 1 ? "s" : ""} found</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userResults.map((u: any) => (
                    <Link key={u.id} href={`/profile/${u.id}`}>
                      <div className="sn-card p-4 flex items-center gap-3 cursor-pointer fade-in active:scale-[0.98] transition-transform">
                        <img
                          src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                          alt=""
                          className="sn-avatar flex-shrink-0"
                          style={{ width: 44, height: 44 }}
                          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${u.name || "U"}`; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                          {u.role === "admin" && <span className="text-xs text-primary font-medium">Admin</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {userResults.length === 0 && userSearchActive && (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      <Users size={32} className="mx-auto mb-3 opacity-20" />
                      <p>No users found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
