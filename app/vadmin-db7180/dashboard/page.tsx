"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, Users, FolderOpen, Lightbulb, MessageSquare, LogOut, Plus, Edit2, Trash2, Globe, LayoutDashboard, Menu, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const NAV = [
  { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "services", label: "Services", icon: <Globe size={16} /> },
  { id: "team", label: "Team", icon: <Users size={16} /> },
  { id: "projects", label: "Projects", icon: <FolderOpen size={16} /> },
  { id: "patents", label: "Patents", icon: <Lightbulb size={16} /> },
  { id: "leads", label: "Leads", icon: <MessageSquare size={16} /> },
];

// Generic CRUD table
function CRUDTable({ title, columns, rows, onAdd, onEdit, onDelete }: {
  title: string;
  columns: string[];
  rows: Record<string, string>[];
  onAdd: () => void;
  onEdit: (row: Record<string, string>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="font-heading font-bold text-white">{title}</h3>
        <button onClick={onAdd} className="flex items-center gap-1.5 bg-accent text-bg text-sm font-bold px-4 py-2 rounded-lg hover:shadow-[0_0_18px_rgba(8,255,200,0.4)] transition-all">
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02]">
            <tr>{columns.map(c => <th key={c} className="text-left px-5 py-3 text-xs text-white/40 font-medium font-mono uppercase">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-5 py-8 text-center text-white/30 text-sm">No records yet. Click Add to create one.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                {columns.map(c => <td key={c} className="px-5 py-3.5 text-white/75 max-w-xs truncate">{row[c.toLowerCase().replace(/ /g, '_')] ?? '—'}</td>)}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(row)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={14} /></button>
                    <button onClick={() => onDelete(row.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple modal
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-muted/30">
          <h3 className="font-heading font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="text-navy/40 hover:text-navy transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

type ServiceRow = { id: string; title: string; category: string; description: string };
type TeamRow = { id: string; name: string; role: string; bio: string };
type ProjectRow = { id: string; type: string; title: string; link: string };
type PatentRow = { id: string; application_number: string; title: string; status: string };
type LeadRow = { id: string; name: string; email: string; service_required: string; status: string; created_at: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState<string | null>(null);

  // Data states
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [patents, setPatents] = useState<PatentRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  // New item forms
  const [newService, setNewService] = useState({ title: "", category: "web-dev", description: "" });
  const [newTeam, setNewTeam] = useState({ name: "", role: "", bio: "" });
  const [newProject, setNewProject] = useState({ type: "webdev", title: "", link: "", description: "" });
  const [newPatent, setNewPatent] = useState({ application_number: "", title: "", status: "pending" });

  useEffect(() => {
    // Verify session
    fetch(`${API}/api/admin/me`, { credentials: "include" })
      .then(r => { if (!r.ok) router.push("/vadmin-db7180"); })
      .catch(() => { /* allow in dev */ });

    // Load data
    Promise.all([
      fetch(`${API}/api/services`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/api/team`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/api/projects`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/api/patents`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/api/leads`, { credentials: "include" }).then(r => r.json()).catch(() => ({ data: { leads: [] } })),
    ]).then(([sv, tm, pr, pt, ld]) => {
      setServices(sv.data || []);
      setTeam(tm.data || []);
      setProjects(pr.data || []);
      setPatents(pt.data || []);
      setLeads(ld.data?.leads || []);
      setLoading(false);
    });
  }, [router]);

  const logout = async () => {
    await fetch(`${API}/api/admin/logout`, { method: "POST", credentials: "include" });
    router.push("/vadmin-db7180");
  };

  const deleteItem = async (entity: string, id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`${API}/api/${entity}/${id}`, { method: "DELETE", credentials: "include" }).catch(() => {});
    if (entity === "services") setServices(s => s.filter(i => i.id !== id));
    if (entity === "team") setTeam(s => s.filter(i => i.id !== id));
    if (entity === "projects") setProjects(s => s.filter(i => i.id !== id));
    if (entity === "patents") setPatents(s => s.filter(i => i.id !== id));
  };

  const addService = async () => {
    const res = await fetch(`${API}/api/services`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(newService) }).catch(() => null);
    if (res?.ok) { const d = await res.json(); setServices(s => [d.data, ...s]); }
    setModal(null);
    setNewService({ title: "", category: "web-dev", description: "" });
  };

  const addTeam = async () => {
    const res = await fetch(`${API}/api/team`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(newTeam) }).catch(() => null);
    if (res?.ok) { const d = await res.json(); setTeam(s => [d.data, ...s]); }
    setModal(null);
    setNewTeam({ name: "", role: "", bio: "" });
  };

  const addProject = async () => {
    const res = await fetch(`${API}/api/projects`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(newProject) }).catch(() => null);
    if (res?.ok) { const d = await res.json(); setProjects(s => [d.data, ...s]); }
    setModal(null);
    setNewProject({ type: "webdev", title: "", link: "", description: "" });
  };

  const addPatent = async () => {
    const res = await fetch(`${API}/api/patents`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(newPatent) }).catch(() => null);
    if (res?.ok) { const d = await res.json(); setPatents(s => [d.data, ...s]); }
    setModal(null);
    setNewPatent({ application_number: "", title: "", status: "pending" });
  };

  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center h-64 text-navy/40">Loading data...</div>;

    switch (tab) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="font-heading text-2xl font-bold text-navy">Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Services", count: services.length, icon: <Globe size={20} className="text-accent" /> },
                { label: "Team Members", count: team.length, icon: <Users size={20} className="text-accent" /> },
                { label: "Projects", count: projects.length, icon: <FolderOpen size={20} className="text-accent" /> },
                { label: "Leads", count: leads.length, icon: <MessageSquare size={20} className="text-accent" /> },
              ].map(({ label, count, icon }) => (
                <div key={label} className="bg-white border border-muted/40 rounded-2xl p-5 flex items-center gap-4">
                  <div className="p-2.5 bg-accent/10 rounded-xl">{icon}</div>
                  <div>
                    <p className="font-heading text-2xl font-bold text-navy">{count}</p>
                    <p className="text-xs text-navy/50">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-muted/40 rounded-2xl p-6">
              <h3 className="font-heading font-bold text-navy mb-4">Recent Leads</h3>
              {leads.slice(0, 5).length === 0 ? (
                <p className="text-navy/40 text-sm">No leads yet.</p>
              ) : leads.slice(0, 5).map(l => (
                <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-muted/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy">{l.name}</p>
                    <p className="text-xs text-navy/50">{l.service_required} · {l.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.status === "new" ? "bg-accent/20 text-navy" : l.status === "contacted" ? "bg-blue-100 text-blue-700" : "bg-muted/40 text-navy/50"}`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "services":
        return (
          <>
            <CRUDTable title="Services" columns={["Title", "Category", "Description"]}
              rows={services.map(s => ({ id: s.id, title: s.title, category: s.category, description: s.description?.slice(0, 60) + "..." }))}
              onAdd={() => setModal("service")} onEdit={() => {}} onDelete={id => deleteItem("services", id)} />
            {modal === "service" && (
              <Modal title="Add Service" onClose={() => setModal(null)}>
                <div className="space-y-3">
                  {[["title", "Title *"], ["description", "Description *"]].map(([f, l]) => (
                    <div key={f}>
                      <label className="block text-xs font-medium text-navy mb-1">{l}</label>
                      <input type="text" value={newService[f as keyof typeof newService]} onChange={e => setNewService({ ...newService, [f]: e.target.value })}
                        className="w-full border border-muted/60 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent/60" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Category</label>
                    <select value={newService.category} onChange={e => setNewService({ ...newService, category: e.target.value })}
                      className="w-full border border-muted/60 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent/60">
                      <option value="web-dev">Web Development</option>
                      <option value="security">Security</option>
                      <option value="ai">AI</option>
                      <option value="consultancy">Consultancy</option>
                    </select>
                  </div>
                  <button onClick={addService} className="w-full bg-accent text-navy font-bold py-2.5 rounded-lg hover:bg-accent/80 transition-all mt-2">Add Service</button>
                </div>
              </Modal>
            )}
          </>
        );

      case "team":
        return (
          <>
            <CRUDTable title="Team Members" columns={["Name", "Role", "Bio"]}
              rows={team.map(m => ({ id: m.id, name: m.name, role: m.role, bio: m.bio?.slice(0, 50) + "..." }))}
              onAdd={() => setModal("team")} onEdit={() => {}} onDelete={id => deleteItem("team", id)} />
            {modal === "team" && (
              <Modal title="Add Team Member" onClose={() => setModal(null)}>
                <div className="space-y-3">
                  {[["name", "Name *"], ["role", "Role *"], ["bio", "Bio"]].map(([f, l]) => (
                    <div key={f}>
                      <label className="block text-xs font-medium text-navy mb-1">{l}</label>
                      <input type="text" value={newTeam[f as keyof typeof newTeam]} onChange={e => setNewTeam({ ...newTeam, [f]: e.target.value })}
                        className="w-full border border-muted/60 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent/60" />
                    </div>
                  ))}
                  <button onClick={addTeam} className="w-full bg-accent text-navy font-bold py-2.5 rounded-lg hover:bg-accent/80 transition-all mt-2">Add Member</button>
                </div>
              </Modal>
            )}
          </>
        );

      case "projects":
        return (
          <>
            <CRUDTable title="Projects" columns={["Type", "Title", "Link"]}
              rows={projects.map(p => ({ id: p.id, type: p.type, title: p.title, link: p.link }))}
              onAdd={() => setModal("project")} onEdit={() => {}} onDelete={id => deleteItem("projects", id)} />
            {modal === "project" && (
              <Modal title="Add Project" onClose={() => setModal(null)}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Type</label>
                    <select value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })}
                      className="w-full border border-muted/60 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent/60">
                      <option value="webdev">Web Development</option>
                      <option value="security">Security</option>
                    </select>
                  </div>
                  {[["title", "Title *"], ["link", "Link (URL)"], ["description", "Description"]].map(([f, l]) => (
                    <div key={f}>
                      <label className="block text-xs font-medium text-navy mb-1">{l}</label>
                      <input type="text" value={newProject[f as keyof typeof newProject]} onChange={e => setNewProject({ ...newProject, [f]: e.target.value })}
                        className="w-full border border-muted/60 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent/60" />
                    </div>
                  ))}
                  <button onClick={addProject} className="w-full bg-accent text-navy font-bold py-2.5 rounded-lg hover:bg-accent/80 transition-all mt-2">Add Project</button>
                </div>
              </Modal>
            )}
          </>
        );

      case "patents":
        return (
          <>
            <CRUDTable title="Patents" columns={["Application No.", "Title", "Status"]}
              rows={patents.map(p => ({ id: p.id, "application_no.": p.application_number, title: p.title?.slice(0, 50) + "...", status: p.status }))}
              onAdd={() => setModal("patent")} onEdit={() => {}} onDelete={id => deleteItem("patents", id)} />
            {modal === "patent" && (
              <Modal title="Add Patent" onClose={() => setModal(null)}>
                <div className="space-y-3">
                  {[["application_number", "Application Number *"], ["title", "Patent Title *"]].map(([f, l]) => (
                    <div key={f}>
                      <label className="block text-xs font-medium text-navy mb-1">{l}</label>
                      <input type="text" value={newPatent[f as keyof typeof newPatent]} onChange={e => setNewPatent({ ...newPatent, [f]: e.target.value })}
                        className="w-full border border-muted/60 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent/60" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Status</label>
                    <select value={newPatent.status} onChange={e => setNewPatent({ ...newPatent, status: e.target.value })}
                      className="w-full border border-muted/60 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent/60">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <button onClick={addPatent} className="w-full bg-accent text-navy font-bold py-2.5 rounded-lg hover:bg-accent/80 transition-all mt-2">Add Patent</button>
                </div>
              </Modal>
            )}
          </>
        );

      case "leads":
        return (
          <div className="bg-white rounded-2xl border border-muted/40 overflow-hidden">
            <div className="px-6 py-4 border-b border-muted/30">
              <h3 className="font-heading font-bold text-navy">Leads & Enquiries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg">
                  <tr>{["Name", "Email", "Service", "Status", "Date"].map(c => <th key={c} className="text-left px-5 py-3 text-xs text-navy/50 font-medium font-mono uppercase">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-muted/20">
                  {leads.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-navy/30 text-sm">No leads yet.</td></tr>
                  ) : leads.map(l => (
                    <tr key={l.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-navy">{l.name}</td>
                      <td className="px-5 py-3.5 text-navy/70">{l.email}</td>
                      <td className="px-5 py-3.5 text-navy/70 max-w-[150px] truncate">{l.service_required}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${l.status === "new" ? "bg-accent/20 text-navy" : l.status === "contacted" ? "bg-blue-100 text-blue-700" : "bg-muted/40 text-navy/50"}`}>{l.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-navy/40 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-60 bg-navy flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-white/10">
          <Image src="/brand/logo-light-2x.png" alt="ECS" width={110} height={34} className="h-8 w-auto" />
          <p className="text-white/30 text-xs mt-1.5 font-mono">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ id, label, icon }) => (
            <button key={id} onClick={() => { setTab(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-accent/20 text-accent" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              {icon} {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="w-full flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-xl hover:bg-red-400/10">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-muted/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-navy p-1">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs text-navy/40">
              <Shield size={14} className="text-accent" />
              <span className="font-mono">ADMIN · EXCELON CYBER SOLUTIONS</span>
            </div>
          </div>
          <button onClick={logout} className="hidden md:flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
