/**
 * CupomZap — Admin Dashboard
 * Full-featured admin panel: metrics, coupons, stores, users,
 * cashback management, withdrawals, affiliate sync.
 *
 * Stack: React (hooks) · Recharts · Tailwind utility classes (inline styles fallback)
 * API: connects to /api/v1 backend
 */

import { useState, useEffect, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  brand: "#E94560",
  brandDark: "#C73550",
  navy: "#1A1A2E",
  navyMid: "#0F3460",
  gold: "#F5A623",
  green: "#22C55E",
  red: "#EF4444",
  surface: "#F2F3F7",
  card: "#FFFFFF",
  border: "#E4E7EF",
  text: "#1A1A2E",
  textSec: "#5A6072",
  textMuted: "#9AA0B2",
};

const css = {
  sidebar: {
    width: 220, background: T.navy, minHeight: "100vh",
    display: "flex", flexDirection: "column", flexShrink: 0,
  },
  mainWrap: {
    flex: 1, display: "flex", flexDirection: "column",
    background: T.surface, minHeight: "100vh", overflow: "auto",
  },
  topbar: {
    background: T.card, borderBottom: `1px solid ${T.border}`,
    padding: "0 28px", height: 60,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 10,
  },
  content: { padding: "28px", flex: 1 },
  card: {
    background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
    padding: 24, marginBottom: 20,
  },
  statCard: {
    background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
    padding: "20px 22px", flex: 1,
  },
  btn: (variant = "primary") => ({
    height: 36, padding: "0 16px", borderRadius: 8, border: "none",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
    background: variant === "primary" ? T.brand : variant === "ghost" ? "transparent" : T.surface,
    color: variant === "primary" ? "#fff" : T.text,
    border: variant === "ghost" ? `1px solid ${T.border}` : "none",
    fontFamily: "Inter, sans-serif",
    display: "inline-flex", alignItems: "center", gap: 6,
    transition: "opacity 0.15s",
  }),
  input: {
    height: 36, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: "0 12px", fontSize: 13, fontFamily: "Inter, sans-serif",
    color: T.text, background: T.card, outline: "none", width: "100%",
  },
  badge: (color = T.brand) => ({
    display: "inline-flex", alignItems: "center",
    padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
    background: color + "18", color: color,
  }),
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "10px 14px", textAlign: "left",
    background: T.surface, color: T.textMuted,
    fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em",
    borderBottom: `1px solid ${T.border}`,
  },
  td: { padding: "12px 14px", borderBottom: `1px solid ${T.border}`, color: T.text },
};

// ── Mock API ──────────────────────────────────────────────────────────────────
const mockMetrics = {
  total_users: 41832, new_users_24h: 127,
  active_coupons: 8743, new_coupons_24h: 34,
  total_uses: 298450,
  pending_cashback: 23, pending_cashback_value: "4821.50",
  pending_withdrawals: 8, pending_withdrawal_value: "1240.00",
};

const mockCoupons = [
  { id: "1", title: "40% OFF em eletrônicos", store_name: "Amazon", code: "AMAZON40", type: "coupon", badge: "hot", uses_count: 12400, success_rate: 96, expires_at: "2025-07-15", is_active: true, is_verified: true },
  { id: "2", title: "30% OFF primeira compra", store_name: "Shopee", code: "SHOPEE30", type: "coupon", badge: "new", uses_count: 8200, success_rate: 88, expires_at: "2025-07-01", is_active: true, is_verified: true },
  { id: "3", title: "Cashback 25% tênis esportivos", store_name: "Netshoes", code: null, type: "cashback", badge: "cashback", uses_count: 3100, success_rate: 99, expires_at: "2025-07-10", is_active: true, is_verified: false },
  { id: "4", title: "R$20 OFF pedido acima R$60", store_name: "iFood", code: "IFOOD20", type: "coupon", badge: "hot", uses_count: 19800, success_rate: 92, expires_at: "2025-07-05", is_active: true, is_verified: true },
  { id: "5", title: "60% OFF roupas femininas", store_name: "Shein", code: "SHEIN60", type: "coupon", badge: "hot", uses_count: 7600, success_rate: 84, expires_at: "2025-07-03", is_active: false, is_verified: true },
  { id: "6", title: "15% OFF hotéis boutique", store_name: "Booking", code: "BOOK15BR", type: "coupon", badge: "exclusive", uses_count: 2300, success_rate: 97, expires_at: "2025-07-20", is_active: true, is_verified: false },
];

const mockUsers = [
  { id: "u1", name: "Maria Silva", email: "maria@email.com", role: "user", is_active: true, cashback_balance: "128.50", total_saved: "843.20", last_login: "2025-06-25T10:30:00Z" },
  { id: "u2", name: "João Santos", email: "joao@email.com", role: "editor", is_active: true, cashback_balance: "45.00", total_saved: "342.80", last_login: "2025-06-24T18:45:00Z" },
  { id: "u3", name: "Ana Costa", email: "ana@email.com", role: "admin", is_active: true, cashback_balance: "0.00", total_saved: "0.00", last_login: "2025-06-25T09:00:00Z" },
  { id: "u4", name: "Carlos Oliveira", email: "carlos@email.com", role: "user", is_active: false, cashback_balance: "22.30", total_saved: "156.40", last_login: "2025-06-10T14:00:00Z" },
  { id: "u5", name: "Fernanda Lima", email: "fernanda@email.com", role: "user", is_active: true, cashback_balance: "310.00", total_saved: "1240.00", last_login: "2025-06-25T12:00:00Z" },
];

const mockWithdrawals = [
  { id: "w1", user_name: "Maria Silva", user_email: "maria@email.com", amount: "128.50", method: "pix", pix_key: "maria@email.com", status: "requested", created_at: "2025-06-24T08:00:00Z" },
  { id: "w2", user_name: "Fernanda Lima", user_email: "fernanda@email.com", amount: "310.00", method: "pix", pix_key: "11999887766", status: "requested", created_at: "2025-06-24T10:30:00Z" },
  { id: "w3", user_name: "João Santos", user_email: "joao@email.com", amount: "45.00", method: "pix", pix_key: "123.456.789-00", status: "processing", created_at: "2025-06-23T16:00:00Z" },
];

const chartData = [
  { day: "Seg", users: 312, uses: 4820, cashback: 840 },
  { day: "Ter", users: 428, uses: 6100, cashback: 1120 },
  { day: "Qua", users: 389, uses: 5340, cashback: 980 },
  { day: "Qui", users: 511, uses: 7200, cashback: 1340 },
  { day: "Sex", users: 682, uses: 9800, cashback: 1890 },
  { day: "Sáb", users: 820, uses: 11200, cashback: 2100 },
  { day: "Dom", users: 127, uses: 3400, cashback: 620 },
];

// ── Mini bar chart (pure SVG, no deps) ────────────────────────────────────────
function BarChart({ data, dataKey, color = T.brand, height = 80 }) {
  const max = Math.max(...data.map(d => d[dataKey]));
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 ${data.length * 40} ${height}`} style={{ width: "100%", height }}>
      {data.map((d, i) => {
        const barH = (d[dataKey] / max) * (height - 20);
        return (
          <g key={i}>
            <rect
              x={i * 40 + 4} y={height - barH - 10}
              width={32} height={barH}
              rx={4} fill={color} fillOpacity={0.85}
            />
            <text x={i * 40 + 20} y={height - 2} textAnchor="middle"
              fontSize={9} fill={T.textMuted}>{d.day}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Components ────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive }) {
  const navItems = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "coupons",   icon: "🏷️", label: "Cupons" },
    { id: "stores",    icon: "🏪", label: "Lojas" },
    { id: "users",     icon: "👥", label: "Usuários" },
    { id: "cashback",  icon: "💰", label: "Cashback" },
    { id: "withdrawals", icon: "💳", label: "Saques" },
    { id: "affiliate", icon: "🔗", label: "Afiliados" },
    { id: "settings",  icon: "⚙️", label: "Configurações" },
  ];

  return (
    <div style={css.sidebar}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>
          ⚡ Cupom<span style={{ color: "#FF6B85" }}>Zap</span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Admin Panel</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {navItems.map(item => (
          <div
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, cursor: "pointer",
              marginBottom: 2, fontSize: 13, fontWeight: 500,
              background: active === item.id ? "rgba(233,69,96,0.18)" : "transparent",
              color: active === item.id ? "#fff" : "rgba(255,255,255,0.55)",
              borderLeft: active === item.id ? `3px solid ${T.brand}` : "3px solid transparent",
              transition: "all 0.12s",
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      {/* Bottom user */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Admin</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>admin@cupomzap.com.br</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color = T.brand }) {
  return (
    <div style={css.statCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontSize: 20 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: T.text, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textMuted }}>{sub}</div>}
    </div>
  );
}

function Toast({ msg, show }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%",
      transform: `translateX(-50%) translateY(${show ? 0 : 80}px)`,
      background: T.navy, color: "#fff", borderRadius: 10,
      padding: "12px 20px", fontSize: 14, fontWeight: 500,
      zIndex: 999, display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <span style={{ color: T.green }}>✓</span> {msg}
    </div>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Dashboard</h1>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 24 }}>Visão geral da plataforma em tempo real</p>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Usuários ativos" value={mockMetrics.total_users.toLocaleString("pt-BR")} sub={`+${mockMetrics.new_users_24h} hoje`} icon="👥" />
        <StatCard label="Cupons ativos" value={mockMetrics.active_coupons.toLocaleString("pt-BR")} sub={`+${mockMetrics.new_coupons_24h} hoje`} icon="🏷️" color={T.navyMid} />
        <StatCard label="Total de usos" value={mockMetrics.total_uses.toLocaleString("pt-BR")} sub="Todos os tempos" icon="📊" color={T.gold} />
        <StatCard label="Saques pendentes" value={`R$ ${parseFloat(mockMetrics.pending_withdrawal_value).toFixed(2)}`} sub={`${mockMetrics.pending_withdrawals} solicitações`} icon="💳" color={T.red} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={css.card}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Novos usuários</div>
          <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 14 }}>Últimos 7 dias</div>
          <BarChart data={chartData} dataKey="users" color={T.brand} />
        </div>
        <div style={css.card}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Usos de cupons</div>
          <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 14 }}>Últimos 7 dias</div>
          <BarChart data={chartData} dataKey="uses" color={T.navyMid} />
        </div>
        <div style={css.card}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Cashback concedido (R$)</div>
          <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 14 }}>Últimos 7 dias</div>
          <BarChart data={chartData} dataKey="cashback" color={T.gold} />
        </div>
      </div>

      {/* Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ ...css.card, background: "#FFF1F2", border: "1px solid #FECDD3" }}>
          <div style={{ fontWeight: 600, color: "#BE123C", marginBottom: 8 }}>⚠️ Cashback pendente de confirmação</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#BE123C" }}>R$ {parseFloat(mockMetrics.pending_cashback_value).toFixed(2)}</div>
          <div style={{ fontSize: 13, color: "#9F1239", marginTop: 4 }}>{mockMetrics.pending_cashback} transações aguardando</div>
        </div>
        <div style={{ ...css.card, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div style={{ fontWeight: 600, color: "#92400E", marginBottom: 8 }}>💳 Saques aguardando processamento</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#D97706" }}>R$ {parseFloat(mockMetrics.pending_withdrawal_value).toFixed(2)}</div>
          <div style={{ fontSize: 13, color: "#92400E", marginTop: 4 }}>{mockMetrics.pending_withdrawals} solicitações</div>
        </div>
      </div>
    </div>
  );
}

function CouponsPage({ showToast }) {
  const [coupons, setCoupons] = useState(mockCoupons);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = coupons.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.store_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" ? c.is_active : !c.is_active);
    return matchSearch && matchFilter;
  });

  const toggleActive = (id) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
    showToast("Cupom atualizado");
  };

  const toggleVerified = (id) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_verified: !c.is_verified } : c));
    showToast("Status de verificação atualizado");
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700 }}>Cupons</h1>
          <p style={{ color: T.textSec, fontSize: 13 }}>{coupons.length} cupons cadastrados</p>
        </div>
        <button style={css.btn()} onClick={() => showToast("Formulário de novo cupom aberto")}>+ Novo cupom</button>
      </div>

      <div style={css.card}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input style={{ ...css.input, maxWidth: 280 }} placeholder="🔍 Buscar cupons..." value={search} onChange={e => setSearch(e.target.value)} />
          {["all","active","inactive"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...css.btn(filter === f ? "primary" : "ghost"), textTransform: "capitalize" }}>
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
          <button style={{ ...css.btn("ghost"), marginLeft: "auto" }} onClick={() => showToast("Sincronizando afiliados...")}>🔄 Sincronizar</button>
        </div>

        <table style={css.table}>
          <thead>
            <tr>
              {["Título","Loja","Código","Tipo","Usos","Taxa","Expira","Status","Ações"].map(h => (
                <th key={h} style={css.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ background: c.is_active ? "transparent" : "#FFF9F9" }}>
                <td style={css.td}>
                  <div style={{ fontWeight: 600, maxWidth: 200 }}>{c.title}</div>
                  {c.is_verified && <span style={{ fontSize: 10, color: T.green }}>✓ Verificado</span>}
                </td>
                <td style={css.td}>{c.store_name}</td>
                <td style={css.td}>
                  {c.code
                    ? <code style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px", fontSize: 12, fontWeight: 700 }}>{c.code}</code>
                    : <span style={{ color: T.textMuted, fontSize: 12 }}>Sem código</span>
                  }
                </td>
                <td style={css.td}>
                  <span style={css.badge(c.type === "cashback" ? T.gold : T.brand)}>{c.type}</span>
                </td>
                <td style={{ ...css.td, fontWeight: 600 }}>{c.uses_count.toLocaleString("pt-BR")}</td>
                <td style={css.td}>
                  <span style={{ color: c.success_rate >= 90 ? T.green : c.success_rate >= 70 ? T.gold : T.red, fontWeight: 600 }}>
                    {c.success_rate}%
                  </span>
                </td>
                <td style={{ ...css.td, fontSize: 12, color: T.textMuted }}>
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td style={css.td}>
                  <span style={css.badge(c.is_active ? T.green : T.red)}>
                    {c.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td style={css.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={css.btn("ghost")} onClick={() => toggleVerified(c.id)} title="Toggle verificado">
                      {c.is_verified ? "✓" : "○"}
                    </button>
                    <button style={{ ...css.btn("ghost"), color: c.is_active ? T.red : T.green }}
                      onClick={() => toggleActive(c.id)}>
                      {c.is_active ? "Desativar" : "Ativar"}
                    </button>
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

function UsersPage({ showToast }) {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState("");

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    showToast("Usuário atualizado");
  };

  const changeRole = (id, role) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    showToast(`Papel alterado para ${role}`);
  };

  const roleColor = { admin: T.brand, editor: T.navyMid, user: T.textMuted };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700 }}>Usuários</h1>
          <p style={{ color: T.textSec, fontSize: 13 }}>{users.length} usuários cadastrados</p>
        </div>
      </div>

      <div style={css.card}>
        <input style={{ ...css.input, maxWidth: 300, marginBottom: 16 }}
          placeholder="🔍 Buscar por nome ou email..."
          value={search} onChange={e => setSearch(e.target.value)} />

        <table style={css.table}>
          <thead>
            <tr>{["Usuário","Papel","Saldo Cashback","Total Economizado","Último acesso","Status","Ações"].map(h => <th key={h} style={css.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={css.td}>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{u.email}</div>
                </td>
                <td style={css.td}>
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 12, fontFamily: "Inter,sans-serif", color: roleColor[u.role] }}>
                    <option value="user">user</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td style={{ ...css.td, fontWeight: 600, color: T.gold }}>R$ {parseFloat(u.cashback_balance).toFixed(2)}</td>
                <td style={{ ...css.td, fontWeight: 600, color: T.green }}>R$ {parseFloat(u.total_saved).toFixed(2)}</td>
                <td style={{ ...css.td, fontSize: 12, color: T.textMuted }}>
                  {u.last_login ? new Date(u.last_login).toLocaleString("pt-BR") : "Nunca"}
                </td>
                <td style={css.td}>
                  <span style={css.badge(u.is_active ? T.green : T.red)}>{u.is_active ? "Ativo" : "Suspenso"}</span>
                </td>
                <td style={css.td}>
                  <button style={{ ...css.btn("ghost"), color: u.is_active ? T.red : T.green }}
                    onClick={() => toggleActive(u.id)}>
                    {u.is_active ? "Suspender" : "Reativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WithdrawalsPage({ showToast }) {
  const [withdrawals, setWithdrawals] = useState(mockWithdrawals);

  const process = (id, status) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status } : w));
    showToast(status === "completed" ? "Saque aprovado e pago" : status === "processing" ? "Saque em processamento" : "Saque rejeitado");
  };

  const statusColor = { requested: T.gold, processing: T.brand, completed: T.green, rejected: T.red };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700 }}>Saques de Cashback</h1>
        <p style={{ color: T.textSec, fontSize: 13 }}>{withdrawals.filter(w => w.status === "requested").length} aguardando processamento</p>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <StatCard label="Total solicitado" value={`R$ ${withdrawals.reduce((s,w) => s + parseFloat(w.amount), 0).toFixed(2)}`} icon="💳" color={T.brand} />
        <StatCard label="Pendentes" value={withdrawals.filter(w => w.status === "requested").length} sub="aguardando ação" icon="⏳" color={T.gold} />
        <StatCard label="Em processamento" value={withdrawals.filter(w => w.status === "processing").length} icon="🔄" color={T.navyMid} />
      </div>

      <div style={css.card}>
        <table style={css.table}>
          <thead>
            <tr>{["Usuário","Valor","Método","Chave PIX","Solicitado em","Status","Ações"].map(h => <th key={h} style={css.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w.id}>
                <td style={css.td}>
                  <div style={{ fontWeight: 600 }}>{w.user_name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{w.user_email}</div>
                </td>
                <td style={{ ...css.td, fontWeight: 700, fontSize: 16, color: T.text }}>R$ {parseFloat(w.amount).toFixed(2)}</td>
                <td style={css.td}><span style={css.badge(T.navyMid)}>PIX</span></td>
                <td style={{ ...css.td, fontSize: 12, fontFamily: "monospace" }}>{w.pix_key}</td>
                <td style={{ ...css.td, fontSize: 12, color: T.textMuted }}>{new Date(w.created_at).toLocaleString("pt-BR")}</td>
                <td style={css.td}><span style={css.badge(statusColor[w.status] || T.textMuted)}>{w.status}</span></td>
                <td style={css.td}>
                  {w.status === "requested" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ ...css.btn(), background: T.green }} onClick={() => process(w.id, "processing")}>Processar</button>
                      <button style={{ ...css.btn("ghost"), color: T.red }} onClick={() => process(w.id, "rejected")}>Rejeitar</button>
                    </div>
                  )}
                  {w.status === "processing" && (
                    <button style={{ ...css.btn(), background: T.green }} onClick={() => process(w.id, "completed")}>Confirmar Pix</button>
                  )}
                  {(w.status === "completed" || w.status === "rejected") && (
                    <span style={{ fontSize: 12, color: T.textMuted }}>Finalizado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AffiliatePage({ showToast }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const networks = [
    { name: "Rakuten Advertising", status: "connected", stores: 42, key: "rak_****_****" },
    { name: "Impact Radius", status: "connected", stores: 78, key: "imp_****_****" },
    { name: "CJ Affiliate", status: "disconnected", stores: 0, key: "—" },
  ];

  const triggerSync = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 2200));
    setSyncing(false);
    setLastSync(new Date());
    showToast("Sincronização de afiliados concluída!");
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700 }}>Afiliados</h1>
          <p style={{ color: T.textSec, fontSize: 13 }}>Redes de afiliados integradas</p>
        </div>
        <button style={{ ...css.btn(), opacity: syncing ? 0.7 : 1 }} onClick={triggerSync} disabled={syncing}>
          {syncing ? "⏳ Sincronizando..." : "🔄 Sincronizar agora"}
        </button>
      </div>

      {lastSync && (
        <div style={{ ...css.card, background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "14px 18px", marginBottom: 16 }}>
          <span style={{ color: T.green, fontWeight: 600 }}>✓ Última sincronização: {lastSync.toLocaleString("pt-BR")}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {networks.map(net => (
          <div key={net.name} style={css.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{net.name}</div>
              <span style={css.badge(net.status === "connected" ? T.green : T.textMuted)}>
                {net.status === "connected" ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: T.textSec }}>
              <div>🏪 {net.stores} lojas sincronizadas</div>
              <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 12, color: T.textMuted }}>Key: {net.key}</div>
            </div>
            <button style={{ ...css.btn("ghost"), marginTop: 14, width: "100%" }}
              onClick={() => showToast("Configurações de " + net.name)}>
              {net.status === "connected" ? "Configurar" : "Conectar"}
            </button>
          </div>
        ))}
      </div>

      <div style={css.card}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Cron Jobs</h3>
        <table style={css.table}>
          <thead>
            <tr>{["Job","Frequência","Último run","Status"].map(h => <th key={h} style={css.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              { job: "Sync cupons afiliados", freq: "A cada 6h", last: "há 2h", status: "ok" },
              { job: "Limpar cupons expirados", freq: "A cada 1h", last: "há 5min", status: "ok" },
              { job: "Checar alertas de preço", freq: "A cada 30min", last: "há 12min", status: "ok" },
              { job: "Reconciliar conversões", freq: "Diário 3h", last: "hoje 03:00", status: "ok" },
              { job: "Atualizar contadores", freq: "Diário 2h", last: "hoje 02:00", status: "ok" },
            ].map(r => (
              <tr key={r.job}>
                <td style={css.td}>{r.job}</td>
                <td style={{ ...css.td, color: T.textMuted }}>{r.freq}</td>
                <td style={{ ...css.td, color: T.textMuted }}>{r.last}</td>
                <td style={css.td}><span style={css.badge(T.green)}>✓ {r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlaceholderPage({ title, icon }) {
  return (
    <div style={{ textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: T.textSec }}>Esta seção está em desenvolvimento</p>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState({ msg: "", show: false });

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2800);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return <DashboardPage />;
      case "coupons":     return <CouponsPage showToast={showToast} />;
      case "users":       return <UsersPage showToast={showToast} />;
      case "withdrawals": return <WithdrawalsPage showToast={showToast} />;
      case "affiliate":   return <AffiliatePage showToast={showToast} />;
      case "stores":      return <PlaceholderPage title="Lojas" icon="🏪" />;
      case "cashback":    return <PlaceholderPage title="Cashback" icon="💰" />;
      case "settings":    return <PlaceholderPage title="Configurações" icon="⚙️" />;
      default:            return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: "flex", fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <Sidebar active={page} setActive={setPage} />

      <div style={css.mainWrap}>
        {/* Topbar */}
        <div style={css.topbar}>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.textSec }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <button style={css.btn("ghost")}>🔔 Notificações</button>
              <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: T.brand, borderRadius: "50%" }}></div>
            </div>
            <button style={css.btn("ghost")} onClick={() => showToast("Saindo...")}>Sair</button>
          </div>
        </div>

        {/* Page content */}
        <div style={css.content}>
          {renderPage()}
        </div>
      </div>

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  );
}
