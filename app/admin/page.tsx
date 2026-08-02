import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getAdminStats, getUsersList, getSystemAuditLogs, updateUserRole } from "@/lib/actions/admin"

export const metadata = {
  title: "Admin Panel - SafeTra",
  description: "SafeTra Secure Auto Exchange Admin Control Console",
}

export default async function AdminConsolePage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/")
  }

  const [stats, usersList, auditLogs] = await Promise.all([
    getAdminStats(),
    getUsersList(),
    getSystemAuditLogs(),
  ])

  return (
    <div className="min-h-screen bg-background text-foreground" dir="ltr">
      {/* Sidebar Navigation */}
      <nav className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-72 bg-surface-container-lowest border-r border-outline-variant shadow-xl z-50">
        <div className="p-6 flex flex-col items-start">
          <h1 className="font-display-lg text-2xl font-bold text-primary mb-8">SafeTra</h1>
          <div className="flex items-center gap-3 p-3 w-full mb-8 glass-panel rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-primary">shield</span>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">SafeTra Admin</p>
              <p className="text-[9px] text-on-surface-variant uppercase font-semibold">System Root Console</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 px-4 flex-1">
          <Link className="flex items-center gap-4 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg shadow-lg" href="/admin">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-semibold">Admin Panel</span>
          </Link>
          <Link className="flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all duration-300 rounded-lg" href="/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-semibold">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all duration-300 rounded-lg" href="/lawyer">
            <span className="material-symbols-outlined">gavel</span>
            <span className="text-sm font-semibold">Reviews</span>
          </Link>
        </div>
        <div className="mt-auto p-6 border-t border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
              {(user.full_name || "AD").split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">{user.full_name || "Administrator"}</p>
              <p className="text-[10px] text-primary font-mono">System Owner</p>
            </div>
            <Link href="/auth/logout" className="material-symbols-outlined text-on-surface-variant text-sm hover:text-primary transition-colors">
              logout
            </Link>
          </div>
        </div>
      </nav>

      {/* Header and Content Area */}
      <header className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex justify-between items-center px-6 h-16 lg:left-72 lg:w-[calc(100%-18rem)]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-on-surface">Admin Console Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[9px] border border-primary/20">ROOT_SECURE</div>
        </div>
      </header>

      <main className="lg:pl-72 pt-24 px-4 lg:px-8 max-w-7xl mx-auto w-full min-h-screen pb-20">
        <h2 className="text-2xl font-bold mb-6 text-on-background">System Performance & Stats</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl border-white/10 hover:border-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-on-surface-variant uppercase">Total Volume</span>
              <span className="material-symbols-outlined text-primary">payments</span>
            </div>
            <p className="text-2xl font-extrabold text-primary">₪{Number(stats.totalVolume).toLocaleString()}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Processed transactions value</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-white/10 hover:border-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-on-surface-variant uppercase">Active Deals</span>
              <span className="material-symbols-outlined text-primary">sync</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{stats.activeDeals} / {stats.totalDeals}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Ongoing transactions vault</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-white/10 hover:border-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-on-surface-variant uppercase">Registered Users</span>
              <span className="material-symbols-outlined text-primary">group</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{stats.totalUsers}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">{stats.lawyerCount} Lawyers &bull; {stats.adminCount} Admins</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-white/10 hover:border-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-on-surface-variant uppercase">Completed VS Cancelled</span>
              <span className="material-symbols-outlined text-primary">done_all</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{stats.completedDeals} &bull; <span className="text-error">{stats.cancelledDeals}</span></p>
            <p className="text-[10px] text-on-surface-variant mt-1">Successful deal comparison ratio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: User Role Management */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">manage_accounts</span>
                User Roles & Account Management
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant text-xs text-on-surface-variant uppercase font-mono">
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Contact info</th>
                      <th className="py-3 px-2">Current Role</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {usersList.map((usr: any) => (
                      <tr key={usr.id} className="hover:bg-surface-container-high/20 transition-colors text-sm">
                        <td className="py-4 px-2 font-semibold text-on-background">{usr.full_name || "Unverified User"}</td>
                        <td className="py-4 px-2">
                          <p className="text-xs font-mono text-on-surface-variant">{usr.email || "No Email"}</p>
                          <p className="text-xs font-mono text-on-surface-variant">{usr.phone || "No Phone"}</p>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${
                            usr.role === "admin"
                              ? "bg-error/10 text-error border-error/20"
                              : usr.role === "lawyer"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-surface-container text-on-surface-variant border-outline-variant"
                          }`}>
                            {usr.role || "user"}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <form action={async (formData: FormData) => {
                            "use server"
                            const targetRole = formData.get("role") as any
                            const profileId = formData.get("profileId") as string
                            await updateUserRole(profileId, targetRole)
                          }} className="inline-flex items-center gap-2">
                            <input type="hidden" name="profileId" value={usr.id} />
                            <select
                              name="role"
                              defaultValue={usr.role || "user"}
                              className="bg-surface-container-high border border-outline-variant text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="user">User</option>
                              <option value="lawyer">Lawyer</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
                            >
                              Save
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: System Logs & Auditing */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-2xl h-[500px] flex flex-col">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                System Logs
              </h3>
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                {auditLogs.map((log: any, index: number) => (
                  <div key={index} className="p-3 rounded-xl bg-surface-container/30 border border-outline-variant/30">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-mono text-primary font-bold">{log.type}</span>
                      <span className="text-[9px] text-on-surface-variant font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface font-medium">{log.message}</p>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center text-xs text-on-surface-variant py-8">No recent events recorded.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
