import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Wallet, Users, LayoutGrid, ListChecks, Settings,
  Heart, Plus, Trash2, Check, X, Search, Download, Pencil, Leaf,
  Truck, Receipt, Clock, Music, Gift, MoreHorizontal, Phone, Mail, ChevronRight
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

/* ---------------- Identidad visual ---------------- */
const C = {
  paper: "#F3F0E7", surface: "#FFFFFF", ink: "#2A2D24", sub: "#6C7060",
  sage: "#7E8A66", sageSoft: "#E7EADD", forest: "#3B4733", line: "#E4DFD2",
  gold: "#B08D57", blush: "#C2998F",
  ok: "#5F7E47", okBg: "#E6EEDB", no: "#B0644D", noBg: "#F3E1DA",
  pend: "#A98C4B", pendBg: "#F2EAD3",
};
const DISPLAY = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const BODY = "'Inter', system-ui, -apple-system, sans-serif";

const eur = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n) || 0);
const uid = () => Math.random().toString(36).slice(2, 9);
const num = (v) => (v === "" || v == null ? 0 : Number(v) || 0);
const daysTo = (date) => {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date().setHours(0, 0, 0, 0)) / 86400000);
};
const fmtDate = (s) => {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  if (isNaN(d)) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

/* ---------------- Datos iniciales ---------------- */
const TASK_GROUPS = [
  ["12 meses antes", ["Establecer el presupuesto", "Crear lista de invitados preliminar", "Definir el estilo o tema", "Buscar y visitar lugares", "Reservar el lugar y el banquete", "Reservar fecha y hora de la ceremonia"]],
  ["10–11 meses antes", ["Contratar fotografía y vídeo", "Contratar catering y cerrar el menú", "Contratar entretenimiento / DJ", "Contratar decoración y floristería", "Comenzar pruebas de vestido de novia", "Decidir atuendos del cortejo"]],
  ["8–9 meses antes", ["Finalizar lista de invitados", "Comprar el vestido de novia", "Comprar el traje del novio", "Reservar transporte", "Elegir el pastel", "Encargar las invitaciones", "Reservar peluquería y maquillaje"]],
  ["6–7 meses antes", ["Reservar luna de miel", "Decidir cortejo nupcial", "Crear web de la boda", "Fotos de pre-boda", "Comprar las alianzas"]],
  ["3–5 meses antes", ["Comprar detalles y recuerdos", "Diseñar el seating plan", "Prueba de menú", "Confirmar minuta con proveedores", "Crear lista de música"]],
  ["1–2 meses antes", ["Enviar las invitaciones", "Crear lista de regalos", "Confirmar transporte de invitados", "Última prueba de vestido y traje", "Documentación de matrimonio"]],
  ["Última semana", ["Confirmar nº final con el catering", "Pagos finales a proveedores", "Preparar kit de emergencia", "Repartir tareas a maestros de ceremonia", "Confirmar timing del día"]],
];
const DONE_AT_START = new Set([]);
const SEED_TASKS = TASK_GROUPS.flatMap(([plazo, items]) => items.map((titulo) => ({ id: uid(), titulo, plazo, hecho: DONE_AT_START.has(titulo) })));
const PLAZOS = TASK_GROUPS.map((g) => g[0]);

const LADOS = ["Novia", "Novio", "Ambos"];
const GRUPOS = ["Familia", "Amigos", "Trabajo", "Otros"];
const COMIDAS = ["Carne", "Pollo", "Pescado", "Vegetariano", "Vegano", "Menú niño"];
const RESTR = ["Ninguna", "Sin gluten", "Vegetariana", "Vegana", "Sin lácteos", "Sin nueces", "Otra"];
const ESTADOS = [
  { v: "confirmado", label: "Confirmado", bg: C.okBg, fg: C.ok },
  { v: "pendiente", label: "Pendiente", bg: C.pendBg, fg: C.pend },
  { v: "rechazado", label: "No asiste", bg: C.noBg, fg: C.no },
];
const CATS_PROV = ["Catering / Banquete", "Fotografía y vídeo", "Música / DJ", "Flores y decoración", "Vestido / traje", "Belleza y peluquería", "Pastel", "Transporte", "Invitaciones", "Joyería", "Otros"];
const ESTADOS_PROV = ["Por contactar", "Presupuesto pedido", "En negociación", "Reservado", "Pagado", "Descartado"];
const PROV_COLOR = { "Reservado": C.ok, "Pagado": C.ok, "En negociación": C.pend, "Presupuesto pedido": C.pend, "Por contactar": C.sub, "Descartado": C.no };
const MOMENTOS = ["Ceremonia", "Cóctel", "Banquete", "Primer baile", "Fiesta", "No quiero que suene"];

const SEED = {
  settings: { couple: "Nuestra boda", date: "" },
  objetivo: 0,
  budget: [
    "Lugar y banquete", "Catering", "Fotografía y vídeo", "Música y DJ", "Vestido de novia",
    "Traje del novio", "Estilismo y belleza", "Flores y decoración", "Invitaciones y papelería",
    "Alianzas", "Detalles y recuerdos", "Pastel", "Transporte", "Luna de miel", "Otros / imprevistos",
  ].map((categoria) => ({ id: uid(), categoria, estimado: 0, real: 0, pagado: 0 })),
  guests: [],
  tables: Array.from({ length: 10 }, (_, i) => ({ id: uid(), nombre: `Mesa ${i + 1}`, capacidad: 10 })),
  tasks: SEED_TASKS,
  vendors: [],
  payments: [],
  schedule: [
    ["10:00", "Peluquería y maquillaje (novia)", "", ""],
    ["11:30", "Preparativos (novio)", "", ""],
    ["12:30", "Fotos de preparativos", "", ""],
    ["13:30", "Llegada de invitados", "", ""],
    ["14:00", "Ceremonia", "", ""],
    ["14:45", "Cóctel de bienvenida", "", ""],
    ["16:00", "Entrada al banquete", "", ""],
    ["16:15", "Banquete", "", ""],
    ["18:30", "Tarta y brindis", "", ""],
    ["19:00", "Primer baile", "", ""],
    ["19:30", "Apertura de barra libre", "", ""],
    ["20:00", "Fiesta / DJ", "", ""],
    ["00:00", "Recena", "", ""],
    ["02:00", "Fin de fiesta", "", ""],
  ].map(([hora, momento, lugar, nota]) => ({ id: uid(), hora, momento, lugar, nota })),
  music: [],
  gifts: [],
};

/* ---------------- Persistencia (localStorage) ---------------- */
const STORAGE_KEY = "bodate-data";
function loadData() {
  try { const v = localStorage.getItem(STORAGE_KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function persist(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignora */ }
}

/* ---------------- UI base ---------------- */
function Eyebrow({ children }) {
  return <div style={{ fontFamily: BODY, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: C.sage, fontWeight: 600 }}>{children}</div>;
}
function Card({ children, style }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, ...style }}>{children}</div>;
}
function Btn({ children, onClick, kind = "primary", small, style }) {
  const base = { fontFamily: BODY, fontWeight: 600, borderRadius: 999, cursor: "pointer", border: "1px solid transparent", display: "inline-flex", alignItems: "center", gap: 6, transition: "all .15s", padding: small ? "6px 12px" : "9px 16px", fontSize: small ? 13 : 14 };
  const kinds = {
    primary: { background: C.forest, color: "#fff" },
    soft: { background: C.sageSoft, color: C.forest },
    ghost: { background: "transparent", color: C.sub, border: `1px solid ${C.line}` },
    danger: { background: "transparent", color: C.no, border: `1px solid ${C.noBg}` },
  };
  return <button onClick={onClick} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
}
function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontFamily: BODY, fontSize: 12, color: C.sub, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = { fontFamily: BODY, fontSize: 14, color: C.ink, background: "#FBFAF6", border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 11px", width: "100%", outline: "none", boxSizing: "border-box" };
function TextInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function Select({ value, onChange, options, style }) {
  return (
    <select value={value} onChange={onChange} style={{ ...inputStyle, ...style }}>
      {options.map((o) => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.label}</option>)}
    </select>
  );
}
function Ring({ value, max, color, big, caption }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 32, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 84, height: 84 }}>
        <svg width="84" height="84" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="42" cy="42" r={r} fill="none" stroke={C.line} strokeWidth="7" />
          <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} style={{ transition: "stroke-dashoffset .6s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: DISPLAY, fontSize: big ? 24 : 22, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span style={{ fontFamily: BODY, fontSize: 12, color: C.sub, textAlign: "center" }}>{caption}</span>
    </div>
  );
}
function H({ children, sub, action }) {
  return (
    <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 700, margin: 0, color: C.ink, lineHeight: 1.05 }}>{children}</h1>
        {sub && <p style={{ margin: "6px 0 0", color: C.sub, fontSize: 14 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function Empty({ icon: Icon, title, hint, action }) {
  return (
    <Card style={{ padding: "44px 22px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: C.sageSoft, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icon size={24} color={C.sage} />
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: C.ink }}>{title}</div>
      <div style={{ color: C.sub, fontSize: 14, margin: "6px auto 16px", maxWidth: 340 }}>{hint}</div>
      {action}
    </Card>
  );
}
function Modal({ title, onClose, children, footer }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(40,40,30,.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, width: "100%", maxWidth: 460, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub }}><X size={22} /></button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 18 }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Navegación ---------------- */
const NAV = [
  { k: "resumen", label: "Resumen", icon: LayoutDashboard, group: null },
  { k: "invitados", label: "Invitados", icon: Users, group: "Planificación" },
  { k: "mesas", label: "Mesas", icon: LayoutGrid, group: "Planificación" },
  { k: "tareas", label: "Tareas", icon: ListChecks, group: "Planificación" },
  { k: "cronograma", label: "Cronograma", icon: Clock, group: "El día" },
  { k: "musica", label: "Música", icon: Music, group: "El día" },
  { k: "regalos", label: "Regalos", icon: Gift, group: "El día" },
  { k: "presupuesto", label: "Presupuesto", icon: Wallet, group: "Dinero" },
  { k: "pagos", label: "Pagos", icon: Receipt, group: "Dinero" },
  { k: "proveedores", label: "Proveedores", icon: Truck, group: "Dinero" },
  { k: "ajustes", label: "Ajustes", icon: Settings, group: null },
];
const MOBILE_PRIMARY = ["resumen", "invitados", "tareas", "presupuesto"];

/* ---------------- App ---------------- */
export default function App() {
  const [data, setData] = useState(() => { const d = loadData(); return d ? { ...SEED, ...d } : SEED; });
  const [tab, setTab] = useState("resumen");
  const [saved, setSaved] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const firstLoad = useRef(true);

  useEffect(() => {
    if (firstLoad.current) { firstLoad.current = false; return; }
    persist(data); setSaved(true);
    const t = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(t);
  }, [data]);

  const up = (patch) => setData((d) => ({ ...d, ...patch }));
  const goto = (k) => { setTab(k); setMoreOpen(false); };

  let lastGroup = "__";
  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box} input,select,button{font-family:inherit}
        ::-webkit-scrollbar{width:9px;height:9px}::-webkit-scrollbar-thumb{background:#d8d2c4;border-radius:9px}`}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside className="hidden md:flex" style={{ width: 236, borderRight: `1px solid ${C.line}`, background: "#FAF8F2", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <Brand couple={data.settings.couple} date={data.settings.date} />
          <nav style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV.map((n) => {
              const showGroup = n.group && n.group !== lastGroup;
              lastGroup = n.group || lastGroup;
              const active = tab === n.k;
              return (
                <React.Fragment key={n.k}>
                  {showGroup && <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: C.sub, fontWeight: 700, padding: "12px 12px 4px" }}>{n.group}</div>}
                  <button onClick={() => goto(n.k)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 11, cursor: "pointer", border: "none", textAlign: "left", fontSize: 14.5, fontWeight: active ? 700 : 500, background: active ? C.sageSoft : "transparent", color: active ? C.forest : C.sub }}>
                    <n.icon size={18} /> {n.label}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
          <div style={{ marginTop: "auto", padding: 16 }}><SaveDot saved={saved} /></div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, paddingBottom: 92 }}>
          <header className="md:hidden" style={{ position: "sticky", top: 0, zIndex: 20 }}>
            <Brand couple={data.settings.couple} date={data.settings.date} mobile />
          </header>
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "26px 18px 40px" }}>
            {tab === "resumen" && <Resumen data={data} go={goto} />}
            {tab === "presupuesto" && <Presupuesto data={data} up={up} />}
            {tab === "invitados" && <Invitados data={data} up={up} />}
            {tab === "mesas" && <Mesas data={data} up={up} />}
            {tab === "tareas" && <Tareas data={data} up={up} />}
            {tab === "proveedores" && <Proveedores data={data} up={up} />}
            {tab === "pagos" && <Pagos data={data} up={up} />}
            {tab === "cronograma" && <Cronograma data={data} up={up} />}
            {tab === "musica" && <Musica data={data} up={up} />}
            {tab === "regalos" && <Regalos data={data} up={up} />}
            {tab === "ajustes" && <Ajustes data={data} up={up} setData={setData} />}
          </div>
        </main>
      </div>

      {/* Bottom nav (móvil) */}
      <nav className="md:hidden" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(250,248,242,.96)", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-around", padding: "6px 4px 10px", backdropFilter: "blur(8px)", zIndex: 30 }}>
        {MOBILE_PRIMARY.map((k) => {
          const n = NAV.find((x) => x.k === k); const active = tab === k;
          return (
            <button key={k} onClick={() => goto(k)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? C.forest : C.sub, cursor: "pointer", flex: 1 }}>
              <n.icon size={21} strokeWidth={active ? 2.4 : 1.8} />
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{n.label}</span>
            </button>
          );
        })}
        <button onClick={() => setMoreOpen(true)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: moreOpen ? C.forest : C.sub, cursor: "pointer", flex: 1 }}>
          <MoreHorizontal size={21} /><span style={{ fontSize: 10.5, fontWeight: 500 }}>Más</span>
        </button>
      </nav>

      {/* Overlay "Más" (móvil) */}
      {moreOpen && (
        <div className="md:hidden" onClick={() => setMoreOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(40,40,30,.45)", zIndex: 40, display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, width: "100%", borderRadius: "20px 20px 0 0", padding: "16px 14px 28px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700 }}>Todas las secciones</span>
              <button onClick={() => setMoreOpen(false)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer" }}><X size={22} /></button>
            </div>
            {NAV.map((n) => (
              <button key={n.k} onClick={() => goto(n.k)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderRadius: 12, border: "none", background: tab === n.k ? C.sageSoft : "transparent", color: tab === n.k ? C.forest : C.ink, cursor: "pointer", fontSize: 15.5, fontWeight: tab === n.k ? 700 : 500, textAlign: "left" }}>
                <n.icon size={19} color={tab === n.k ? C.forest : C.sage} /> <span style={{ flex: 1 }}>{n.label}</span>
                {n.group && <span style={{ fontSize: 11, color: C.sub }}>{n.group}</span>}
                <ChevronRight size={16} color={C.line} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Marca / cabecera ---------------- */
function Brand({ couple, date, mobile }) {
  const dias = daysTo(date);
  return (
    <div style={{ padding: mobile ? "12px 16px" : "20px 18px 14px", borderBottom: `1px solid ${C.line}`, background: mobile ? "rgba(250,248,242,.96)" : "transparent", backdropFilter: mobile ? "blur(8px)" : "none", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Heart size={18} color="#fff" fill="#fff" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 700, lineHeight: 1, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{couple || "Nuestra boda"}</div>
        <div style={{ fontSize: 11.5, color: C.sage, fontWeight: 600, marginTop: 3 }}>
          {dias == null ? "Pon vuestra fecha en Ajustes" : dias > 0 ? `Faltan ${dias} días` : dias === 0 ? "¡Es hoy! 🎉" : "¡Recién casados!"}
        </div>
      </div>
    </div>
  );
}
function SaveDot({ saved }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: saved ? C.ok : C.sub, transition: "color .3s" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: saved ? C.ok : C.line }} />
      {saved ? "Guardado" : "Se guarda solo"}
    </div>
  );
}

/* ---------------- Resumen ---------------- */
function Resumen({ data, go }) {
  const real = data.budget.reduce((s, b) => s + num(b.real), 0);
  const pagado = data.budget.reduce((s, b) => s + num(b.pagado), 0);
  const conf = data.guests.filter((g) => g.estado === "confirmado").length;
  const hechas = data.tasks.filter((t) => t.hecho).length;
  const dias = daysTo(data.settings.date);
  const recaudado = data.gifts.reduce((s, g) => s + num(g.importe), 0);
  const cubiertos = conf || data.guests.length;
  const porCubierto = cubiertos ? Math.round(real / cubiertos) : 0;

  const pie = useMemo(() => {
    const arr = data.budget.filter((b) => num(b.real) > 0).map((b) => ({ name: b.categoria, value: num(b.real) })).sort((a, b) => b.value - a.value);
    const top = arr.slice(0, 6); const resto = arr.slice(6).reduce((s, x) => s + x.value, 0);
    if (resto > 0) top.push({ name: "Otros", value: resto });
    return top;
  }, [data.budget]);
  const PAL = [C.forest, C.sage, C.gold, C.blush, "#9AA77F", "#C8B27E", "#A9876F"];

  const proximasTareas = data.tasks.filter((t) => !t.hecho).slice(0, 4);
  const proximosPagos = data.payments.filter((p) => !p.pagado).sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9")).slice(0, 4);

  return (
    <div>
      <H sub="Todo vuestro día, en un vistazo.">Resumen</H>

      <Card style={{ padding: "26px 22px", marginBottom: 16, background: "linear-gradient(135deg,#FBFAF5,#EFEFE4)", position: "relative", overflow: "hidden" }}>
        <Leaf size={140} color={C.sageSoft} style={{ position: "absolute", right: -24, bottom: -34, transform: "rotate(-18deg)" }} />
        <div style={{ position: "relative" }}>
          <Eyebrow>Cuenta atrás</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 700, color: C.forest, lineHeight: .9 }}>{dias == null ? "—" : Math.abs(dias)}</span>
            <span style={{ fontSize: 16, color: C.sub }}>{dias == null ? "días (añade la fecha)" : dias > 0 ? "días para el gran día" : dias === 0 ? "¡es hoy!" : "días desde la boda"}</span>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: 16, display: "flex", justifyContent: "center" }}><Ring value={conf} max={data.guests.length} color={C.sage} caption={`${conf}/${data.guests.length} confirmados`} /></Card>
        <Card style={{ padding: 16, display: "flex", justifyContent: "center" }}><Ring value={real} max={data.objetivo} color={C.gold} caption={`${eur(real)} de ${eur(data.objetivo)}`} /></Card>
        <Card style={{ padding: 16, display: "flex", justifyContent: "center" }}><Ring value={hechas} max={data.tasks.length} color={C.forest} caption={`${hechas}/${data.tasks.length} tareas`} /></Card>
      </div>

      {/* Próximas tareas + próximos pagos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Eyebrow>Próximas tareas</Eyebrow>
            <button onClick={() => go("tareas")} style={{ background: "none", border: "none", color: C.sage, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Ver todas</button>
          </div>
          {proximasTareas.length === 0 ? <div style={{ fontSize: 13, color: C.sub }}>¡Todo hecho! 🎉</div> :
            proximasTareas.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13.5 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: C.sage, flexShrink: 0 }} />
                <span style={{ flex: 1, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.titulo}</span>
                <span style={{ fontSize: 11, color: C.sub }}>{t.plazo}</span>
              </div>
            ))}
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Eyebrow>Próximos pagos</Eyebrow>
            <button onClick={() => go("pagos")} style={{ background: "none", border: "none", color: C.sage, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Ver todos</button>
          </div>
          {proximosPagos.length === 0 ? <div style={{ fontSize: 13, color: C.sub }}>No hay pagos pendientes.</div> :
            proximosPagos.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13.5 }}>
                <span style={{ flex: 1, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.concepto}</span>
                {p.fecha && <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>{fmtDate(p.fecha)}</span>}
                <span style={{ fontWeight: 700, color: C.ink }}>{eur(p.importe)}</span>
              </div>
            ))}
        </Card>
      </div>

      <Card style={{ padding: 18, marginBottom: 16 }}>
        <Eyebrow>Gastos por categoría</Eyebrow>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginTop: 8 }}>
          <div style={{ width: 150, height: 150 }}>
            {pie.length ? (
              <ResponsiveContainer>
                <PieChart><Pie data={pie} dataKey="value" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">{pie.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}</Pie></PieChart>
              </ResponsiveContainer>
            ) : <div style={{ color: C.sub, fontSize: 13, paddingTop: 50, textAlign: "center" }}>Sin datos</div>}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            {pie.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: PAL[i % PAL.length], flexShrink: 0 }} />
                <span style={{ flex: 1, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                <span style={{ color: C.sub, fontWeight: 600 }}>{eur(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}`, fontSize: 13, flexWrap: "wrap" }}>
          <span style={{ color: C.sub }}>Pagado: <b style={{ color: C.ink }}>{eur(pagado)}</b></span>
          <span style={{ color: C.sub }}>Pendiente: <b style={{ color: C.ink }}>{eur(real - pagado)}</b></span>
          <span style={{ color: C.sub }}>Coste por cubierto: <b style={{ color: C.ink }}>{eur(porCubierto)}</b></span>
          {recaudado > 0 && <span style={{ color: C.sub }}>Regalos: <b style={{ color: C.ok }}>{eur(recaudado)}</b></span>}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Presupuesto ---------------- */
function Presupuesto({ data, up }) {
  const set = (id, field, val) => up({ budget: data.budget.map((b) => (b.id === id ? { ...b, [field]: val } : b)) });
  const add = () => up({ budget: [...data.budget, { id: uid(), categoria: "Nueva partida", estimado: 0, real: 0, pagado: 0 }] });
  const del = (id) => up({ budget: data.budget.filter((b) => b.id !== id) });
  const tReal = data.budget.reduce((s, b) => s + num(b.real), 0);
  const tPag = data.budget.reduce((s, b) => s + num(b.pagado), 0);

  return (
    <div>
      <H sub="Edita cada partida. El restante y los totales se calculan solos.">Presupuesto</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
        <Stat label="Presupuesto objetivo" value={eur(data.objetivo)} editable onChange={(v) => up({ objetivo: num(v) })} raw={data.objetivo} />
        <Stat label="Coste real total" value={eur(tReal)} />
        <Stat label="Pagado" value={eur(tPag)} accent={C.ok} />
        <Stat label="Pendiente de pago" value={eur(tReal - tPag)} accent={C.no} />
      </div>
      <div style={{ marginBottom: 14, fontSize: 13, color: C.sub }}>Restante sobre objetivo: <b style={{ color: data.objetivo - tReal >= 0 ? C.ok : C.no }}>{eur(data.objetivo - tReal)}</b></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.budget.map((b) => {
          const rest = num(b.real) - num(b.pagado);
          return (
            <Card key={b.id} style={{ padding: 12 }}>
              <input value={b.categoria} onChange={(e) => set(b.id, "categoria", e.target.value)} style={{ ...inputStyle, background: "transparent", border: "none", fontWeight: 600, fontSize: 14.5, padding: "2px 0", marginBottom: 8 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                <MiniNum label="Estimado" value={b.estimado} onChange={(v) => set(b.id, "estimado", v)} />
                <MiniNum label="Coste real" value={b.real} onChange={(v) => set(b.id, "real", v)} />
                <MiniNum label="Pagado" value={b.pagado} onChange={(v) => set(b.id, "pagado", v)} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 12.5, color: C.sub }}>Pendiente: <b style={{ color: rest > 0 ? C.no : C.ok }}>{eur(rest)}</b></span>
                <button onClick={() => del(b.id)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12.5 }}><Trash2 size={14} /> Quitar</button>
              </div>
            </Card>
          );
        })}
      </div>
      <Btn kind="soft" onClick={add} style={{ marginTop: 12 }}><Plus size={16} /> Añadir partida</Btn>
    </div>
  );
}
function Stat({ label, value, accent, editable, onChange, raw }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{label}</div>
      {editable ? <input type="number" value={raw} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, background: "transparent", border: "none", padding: "2px 0", fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: accent || C.ink }} />
        : <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: accent || C.ink, marginTop: 2 }}>{value}</div>}
    </Card>
  );
}
function MiniNum({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, padding: "7px 8px", fontSize: 13 }} />
    </div>
  );
}

/* ---------------- Invitados ---------------- */
function Invitados({ data, up }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [editing, setEditing] = useState(null);
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const blank = { id: "", nombre: "", lado: "Ambos", grupo: "Amigos", estado: "pendiente", mesa: "", comida: "Carne", restriccion: "Ninguna", notas: "" };

  const counts = {
    total: data.guests.length,
    confirmado: data.guests.filter((g) => g.estado === "confirmado").length,
    pendiente: data.guests.filter((g) => g.estado === "pendiente").length,
    rechazado: data.guests.filter((g) => g.estado === "rechazado").length,
  };
  const list = data.guests.filter((g) => (filtro === "todos" || g.estado === filtro) && g.nombre.toLowerCase().includes(q.toLowerCase()));

  const save = (g) => { if (!g.nombre.trim()) return; if (g.id) up({ guests: data.guests.map((x) => (x.id === g.id ? g : x)) }); else up({ guests: [...data.guests, { ...g, id: uid() }] }); setEditing(null); };
  const del = (id) => up({ guests: data.guests.filter((g) => g.id !== id) });
  const cycleEstado = (g) => { const order = ["confirmado", "pendiente", "rechazado"]; const next = order[(order.indexOf(g.estado) + 1) % 3]; up({ guests: data.guests.map((x) => (x.id === g.id ? { ...x, estado: next } : x)) }); };
  const addBulk = () => {
    const nuevos = bulkText.split("\n").map((s) => s.trim()).filter(Boolean).map((nombre) => ({ ...blank, id: uid(), nombre }));
    if (nuevos.length) up({ guests: [...data.guests, ...nuevos] });
    setBulkText(""); setBulk(false);
  };

  return (
    <div>
      <H sub={`${counts.total} invitados · ${counts.confirmado} confirmados · ${counts.pendiente} pendientes`}>Invitados</H>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
          <Search size={16} color={C.sub} style={{ position: "absolute", left: 11, top: 11 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar invitado…" style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <Btn kind="ghost" onClick={() => setBulk((v) => !v)}>Añadir varios</Btn>
        <Btn onClick={() => setEditing({ ...blank })}><Plus size={16} /> Añadir</Btn>
      </div>

      {bulk && (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>Pega o escribe un nombre por línea. Se añadirán como pendientes.</div>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={5} placeholder={"Marta López\nJuan Pérez\nAbuela Carmen"} style={{ ...inputStyle, resize: "vertical", fontFamily: BODY }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn onClick={addBulk}><Check size={16} /> Añadir lista</Btn>
            <Btn kind="ghost" onClick={() => setBulk(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[["todos", "Todos", counts.total], ["confirmado", "Confirmados", counts.confirmado], ["pendiente", "Pendientes", counts.pendiente], ["rechazado", "No asisten", counts.rechazado]].map(([k, lbl, n]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{ border: `1px solid ${filtro === k ? C.forest : C.line}`, background: filtro === k ? C.forest : "transparent", color: filtro === k ? "#fff" : C.sub, borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{lbl} · {n}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty icon={Users} title="Aún no hay invitados" hint="Añade a vuestros invitados para llevar el control de confirmaciones, mesas y menús." action={<Btn onClick={() => setEditing({ ...blank })}><Plus size={16} /> Añadir el primero</Btn>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((g) => {
            const est = ESTADOS.find((e) => e.v === g.estado);
            const mesa = data.tables.find((t) => t.id === g.mesa);
            return (
              <Card key={g.id} style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: C.ink }}>{g.nombre}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span>{g.lado} · {g.grupo}</span>{mesa && <span>· {mesa.nombre}</span>}<span>· {g.comida}</span>{g.restriccion !== "Ninguna" && <span style={{ color: C.gold }}>· {g.restriccion}</span>}
                  </div>
                </div>
                <button onClick={() => cycleEstado(g)} title="Cambiar estado" style={{ border: "none", cursor: "pointer", background: est.bg, color: est.fg, fontWeight: 700, fontSize: 12, borderRadius: 999, padding: "5px 10px", whiteSpace: "nowrap" }}>{est.label}</button>
                <button onClick={() => setEditing(g)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer" }}><Pencil size={16} /></button>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? "Editar invitado" : "Nuevo invitado"} onClose={() => setEditing(null)}
          footer={<div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => save(editing)} style={{ flex: 1, justifyContent: "center" }}><Check size={16} /> Guardar</Btn>
            {editing.id && <Btn kind="danger" onClick={() => { del(editing.id); setEditing(null); }}><Trash2 size={16} /></Btn>}
          </div>}>
          <GuestForm g={editing} setG={setEditing} tables={data.tables} />
        </Modal>
      )}
    </div>
  );
}
function GuestForm({ g, setG, tables }) {
  const f = (k, v) => setG((s) => ({ ...s, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Nombre y apellidos"><TextInput value={g.nombre} onChange={(e) => f("nombre", e.target.value)} placeholder="Ej.: Marta López" autoFocus /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Lado"><Select value={g.lado} onChange={(e) => f("lado", e.target.value)} options={LADOS} /></Field>
        <Field label="Grupo"><Select value={g.grupo} onChange={(e) => f("grupo", e.target.value)} options={GRUPOS} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Menú"><Select value={g.comida} onChange={(e) => f("comida", e.target.value)} options={COMIDAS} /></Field>
        <Field label="Restricción"><Select value={g.restriccion} onChange={(e) => f("restriccion", e.target.value)} options={RESTR} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Estado"><Select value={g.estado} onChange={(e) => f("estado", e.target.value)} options={ESTADOS} /></Field>
        <Field label="Mesa"><Select value={g.mesa} onChange={(e) => f("mesa", e.target.value)} options={[{ v: "", label: "Sin asignar" }, ...tables.map((t) => ({ v: t.id, label: t.nombre }))]} /></Field>
      </div>
      <Field label="Notas"><TextInput value={g.notas} onChange={(e) => f("notas", e.target.value)} placeholder="Alergias, parentesco…" /></Field>
    </div>
  );
}

/* ---------------- Mesas ---------------- */
function Mesas({ data, up }) {
  const addTable = () => up({ tables: [...data.tables, { id: uid(), nombre: `Mesa ${data.tables.length + 1}`, capacidad: 10 }] });
  const delTable = (id) => up({ tables: data.tables.filter((t) => t.id !== id), guests: data.guests.map((g) => (g.mesa === id ? { ...g, mesa: "" } : g)) });
  const setTable = (id, field, val) => up({ tables: data.tables.map((t) => (t.id === id ? { ...t, [field]: val } : t)) });
  const assign = (guestId, tableId) => up({ guests: data.guests.map((g) => (g.id === guestId ? { ...g, mesa: tableId } : g)) });
  const sinMesa = data.guests.filter((g) => !g.mesa);

  return (
    <div>
      <H sub="Crea mesas y reparte a los invitados. El aforo se actualiza solo.">Mesas</H>
      {sinMesa.length > 0 && (
        <Card style={{ padding: 14, marginBottom: 14, background: C.pendBg, border: `1px solid ${C.pend}33` }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, marginBottom: 8 }}>Sin mesa asignada ({sinMesa.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sinMesa.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13.5, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.nombre}</span>
                <Select value="" onChange={(e) => assign(g.id, e.target.value)} style={{ width: 150, padding: "6px 8px", fontSize: 13 }} options={[{ v: "", label: "Asignar a…" }, ...data.tables.map((t) => ({ v: t.id, label: t.nombre }))]} />
              </div>
            ))}
          </div>
        </Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
        {data.tables.map((t) => {
          const occ = data.guests.filter((g) => g.mesa === t.id); const full = occ.length >= num(t.capacidad);
          return (
            <Card key={t.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <input value={t.nombre} onChange={(e) => setTable(t.id, "nombre", e.target.value)} style={{ ...inputStyle, background: "transparent", border: "none", fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, padding: 0, width: "60%" }} />
                <button onClick={() => delTable(t.id)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer" }}><Trash2 size={15} /></button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, color: full ? C.no : C.sage, fontWeight: 700 }}>{occ.length}</span>
                <span style={{ fontSize: 12.5, color: C.sub }}>/</span>
                <input type="number" value={t.capacidad} onChange={(e) => setTable(t.id, "capacidad", num(e.target.value))} style={{ ...inputStyle, width: 48, padding: "3px 6px", fontSize: 12.5 }} />
                <span style={{ fontSize: 12.5, color: C.sub }}>asientos</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {occ.length === 0 && <span style={{ fontSize: 12.5, color: C.sub, fontStyle: "italic" }}>Vacía</span>}
                {occ.map((g) => (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: C.sage }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.nombre}</span>
                    <button onClick={() => assign(g.id, "")} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer" }}><X size={13} /></button>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      <Btn kind="soft" onClick={addTable} style={{ marginTop: 12 }}><Plus size={16} /> Añadir mesa</Btn>
    </div>
  );
}

/* ---------------- Tareas ---------------- */
function Tareas({ data, up }) {
  const [nueva, setNueva] = useState("");
  const [plazoNueva, setPlazoNueva] = useState(PLAZOS[0]);
  const toggle = (id) => up({ tasks: data.tasks.map((t) => (t.id === id ? { ...t, hecho: !t.hecho } : t)) });
  const del = (id) => up({ tasks: data.tasks.filter((t) => t.id !== id) });
  const add = () => { if (!nueva.trim()) return; up({ tasks: [...data.tasks, { id: uid(), titulo: nueva.trim(), plazo: plazoNueva, hecho: false }] }); setNueva(""); };
  const hechas = data.tasks.filter((t) => t.hecho).length;
  const pct = data.tasks.length ? Math.round((hechas / data.tasks.length) * 100) : 0;
  const uniquePlazos = [...new Set([...PLAZOS, ...data.tasks.map((t) => t.plazo)])];

  return (
    <div>
      <H sub={`${hechas} de ${data.tasks.length} completadas`}>Tareas</H>
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <Eyebrow>Progreso</Eyebrow><span style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, color: C.forest }}>{pct}%</span>
        </div>
        <div style={{ height: 10, background: C.line, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: C.sage, borderRadius: 99, transition: "width .5s" }} /></div>
      </Card>
      <Card style={{ padding: 12, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nueva tarea…" style={{ ...inputStyle, flex: 1, minWidth: 150 }} />
        <Select value={plazoNueva} onChange={(e) => setPlazoNueva(e.target.value)} options={PLAZOS} style={{ width: 150 }} />
        <Btn onClick={add}><Plus size={16} /></Btn>
      </Card>
      {uniquePlazos.map((plazo) => {
        const items = data.tasks.filter((t) => t.plazo === plazo); if (!items.length) return null;
        const done = items.filter((t) => t.hecho).length;
        return (
          <div key={plazo} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.ink }}>{plazo}</span>
              <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{done}/{items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((t) => (
                <Card key={t.id} style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 11 }}>
                  <button onClick={() => toggle(t.id)} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", border: `2px solid ${t.hecho ? C.sage : C.line}`, background: t.hecho ? C.sage : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.hecho && <Check size={14} color="#fff" strokeWidth={3} />}</button>
                  <span style={{ flex: 1, fontSize: 14.5, color: t.hecho ? C.sub : C.ink, textDecoration: t.hecho ? "line-through" : "none" }}>{t.titulo}</span>
                  <button onClick={() => del(t.id)} style={{ background: "none", border: "none", color: C.line, cursor: "pointer" }}><Trash2 size={15} /></button>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Proveedores ---------------- */
function Proveedores({ data, up }) {
  const [editing, setEditing] = useState(null);
  const blank = { id: "", categoria: CATS_PROV[0], nombre: "", telefono: "", email: "", coste: 0, senal: 0, estado: "Por contactar", notas: "" };
  const save = (v) => { if (!v.nombre.trim()) return; if (v.id) up({ vendors: data.vendors.map((x) => (x.id === v.id ? v : x)) }); else up({ vendors: [...data.vendors, { ...v, id: uid() }] }); setEditing(null); };
  const del = (id) => up({ vendors: data.vendors.filter((v) => v.id !== id) });
  const totalCoste = data.vendors.reduce((s, v) => s + num(v.coste), 0);
  const totalSenal = data.vendors.reduce((s, v) => s + num(v.senal), 0);

  return (
    <div>
      <H sub={`${data.vendors.length} proveedores · ${eur(totalCoste)} en total`} action={<Btn onClick={() => setEditing({ ...blank })}><Plus size={16} /> Añadir</Btn>}>Proveedores</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        <Stat label="Coste total" value={eur(totalCoste)} />
        <Stat label="Señales pagadas" value={eur(totalSenal)} accent={C.ok} />
        <Stat label="Pendiente" value={eur(totalCoste - totalSenal)} accent={C.no} />
      </div>
      {data.vendors.length === 0 ? (
        <Empty icon={Truck} title="Sin proveedores todavía" hint="Guarda aquí cada proveedor con su contacto, coste y estado para tenerlo todo a mano." action={<Btn onClick={() => setEditing({ ...blank })}><Plus size={16} /> Añadir proveedor</Btn>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.vendors.map((v) => (
            <Card key={v.id} style={{ padding: 13 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: C.sage, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>{v.categoria}</div>
                  <div style={{ fontWeight: 600, fontSize: 15.5, color: C.ink, marginTop: 2 }}>{v.nombre}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", fontSize: 12.5, color: C.sub }}>
                    {v.telefono && <a href={`tel:${v.telefono}`} style={{ color: C.sub, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Phone size={13} /> {v.telefono}</a>}
                    {v.email && <a href={`mailto:${v.email}`} style={{ color: C.sub, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Mail size={13} /> {v.email}</a>}
                  </div>
                  {v.notas && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, fontStyle: "italic" }}>{v.notas}</div>}
                </div>
                <button onClick={() => setEditing(v)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer" }}><Pencil size={16} /></button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: PROV_COLOR[v.estado] || C.sub, borderRadius: 999, padding: "3px 10px" }}>{v.estado}</span>
                <span style={{ fontSize: 13, color: C.sub, marginLeft: "auto" }}>Coste <b style={{ color: C.ink }}>{eur(v.coste)}</b></span>
                <span style={{ fontSize: 13, color: C.sub }}>Señal <b style={{ color: C.ok }}>{eur(v.senal)}</b></span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Editar proveedor" : "Nuevo proveedor"} onClose={() => setEditing(null)}
          footer={<div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => save(editing)} style={{ flex: 1, justifyContent: "center" }}><Check size={16} /> Guardar</Btn>
            {editing.id && <Btn kind="danger" onClick={() => { del(editing.id); setEditing(null); }}><Trash2 size={16} /></Btn>}
          </div>}>
          {(() => { const f = (k, val) => setEditing((s) => ({ ...s, [k]: val })); const v = editing; return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Nombre del proveedor"><TextInput value={v.nombre} onChange={(e) => f("nombre", e.target.value)} placeholder="Ej.: Floristería Aroma" autoFocus /></Field>
              <Field label="Categoría"><Select value={v.categoria} onChange={(e) => f("categoria", e.target.value)} options={CATS_PROV} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Teléfono"><TextInput value={v.telefono} onChange={(e) => f("telefono", e.target.value)} placeholder="600 000 000" /></Field>
                <Field label="Email"><TextInput value={v.email} onChange={(e) => f("email", e.target.value)} placeholder="hola@…" /></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Coste (€)"><TextInput type="number" value={v.coste} onChange={(e) => f("coste", num(e.target.value))} /></Field>
                <Field label="Señal pagada (€)"><TextInput type="number" value={v.senal} onChange={(e) => f("senal", num(e.target.value))} /></Field>
              </div>
              <Field label="Estado"><Select value={v.estado} onChange={(e) => f("estado", e.target.value)} options={ESTADOS_PROV} /></Field>
              <Field label="Notas"><TextInput value={v.notas} onChange={(e) => f("notas", e.target.value)} placeholder="Qué incluye, condiciones…" /></Field>
            </div>
          ); })()}
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Pagos ---------------- */
function Pagos({ data, up }) {
  const [editing, setEditing] = useState(null);
  const blank = { id: "", concepto: "", importe: 0, fecha: "", pagado: false };
  const save = (p) => { if (!p.concepto.trim()) return; if (p.id) up({ payments: data.payments.map((x) => (x.id === p.id ? p : x)) }); else up({ payments: [...data.payments, { ...p, id: uid() }] }); setEditing(null); };
  const del = (id) => up({ payments: data.payments.filter((p) => p.id !== id) });
  const toggle = (id) => up({ payments: data.payments.map((p) => (p.id === id ? { ...p, pagado: !p.pagado } : p)) });

  const total = data.payments.reduce((s, p) => s + num(p.importe), 0);
  const pagado = data.payments.filter((p) => p.pagado).reduce((s, p) => s + num(p.importe), 0);
  const orden = [...data.payments].sort((a, b) => (a.pagado - b.pagado) || ((a.fecha || "9").localeCompare(b.fecha || "9")));

  return (
    <div>
      <H sub="Controla señales y pagos con sus fechas de vencimiento." action={<Btn onClick={() => setEditing({ ...blank })}><Plus size={16} /> Añadir</Btn>}>Pagos</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        <Stat label="Total" value={eur(total)} />
        <Stat label="Pagado" value={eur(pagado)} accent={C.ok} />
        <Stat label="Pendiente" value={eur(total - pagado)} accent={C.no} />
      </div>
      {data.payments.length === 0 ? (
        <Empty icon={Receipt} title="Sin pagos registrados" hint="Apunta cada pago con su importe y fecha para no perder ningún vencimiento." action={<Btn onClick={() => setEditing({ ...blank })}><Plus size={16} /> Añadir pago</Btn>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orden.map((p) => {
            const d = daysTo(p.fecha);
            const vence = !p.pagado && d != null && d <= 14;
            return (
              <Card key={p.id} style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, opacity: p.pagado ? .7 : 1 }}>
                <button onClick={() => toggle(p.id)} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", border: `2px solid ${p.pagado ? C.sage : C.line}`, background: p.pagado ? C.sage : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{p.pagado && <Check size={14} color="#fff" strokeWidth={3} />}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: C.ink, textDecoration: p.pagado ? "line-through" : "none" }}>{p.concepto}</div>
                  {p.fecha && <div style={{ fontSize: 12, color: vence ? C.no : C.sub, fontWeight: vence ? 700 : 500, marginTop: 2 }}>{fmtDate(p.fecha)}{vence && d >= 0 ? ` · vence en ${d} días` : ""}{d != null && d < 0 && !p.pagado ? " · vencido" : ""}</div>}
                </div>
                <span style={{ fontWeight: 700, color: C.ink }}>{eur(p.importe)}</span>
                <button onClick={() => setEditing(p)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer" }}><Pencil size={15} /></button>
              </Card>
            );
          })}
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Editar pago" : "Nuevo pago"} onClose={() => setEditing(null)}
          footer={<div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => save(editing)} style={{ flex: 1, justifyContent: "center" }}><Check size={16} /> Guardar</Btn>
            {editing.id && <Btn kind="danger" onClick={() => { del(editing.id); setEditing(null); }}><Trash2 size={16} /></Btn>}
          </div>}>
          {(() => { const f = (k, val) => setEditing((s) => ({ ...s, [k]: val })); const p = editing; return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Concepto"><TextInput value={p.concepto} onChange={(e) => f("concepto", e.target.value)} placeholder="Ej.: Resto del banquete" autoFocus /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Importe (€)"><TextInput type="number" value={p.importe} onChange={(e) => f("importe", num(e.target.value))} /></Field>
                <Field label="Vence el"><TextInput type="date" value={p.fecha} onChange={(e) => f("fecha", e.target.value)} /></Field>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={p.pagado} onChange={(e) => f("pagado", e.target.checked)} /> Ya está pagado
              </label>
            </div>
          ); })()}
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Cronograma ---------------- */
function Cronograma({ data, up }) {
  const set = (id, k, v) => up({ schedule: data.schedule.map((s) => (s.id === id ? { ...s, [k]: v } : s)) });
  const add = () => up({ schedule: [...data.schedule, { id: uid(), hora: "", momento: "", lugar: "", nota: "" }] });
  const del = (id) => up({ schedule: data.schedule.filter((s) => s.id !== id) });
  const orden = [...data.schedule].sort((a, b) => (a.hora || "z").localeCompare(b.hora || "z"));

  return (
    <div>
      <H sub="La minuta del día, hora a hora." action={<Btn onClick={add}><Plus size={16} /> Añadir</Btn>}>Cronograma</H>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {orden.map((s, i) => (
          <div key={s.id} style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14 }}>
              <span style={{ width: 11, height: 11, borderRadius: 99, background: C.sage, border: `2px solid ${C.paper}`, flexShrink: 0 }} />
              {i < orden.length - 1 && <span style={{ flex: 1, width: 2, background: C.line, marginTop: 2 }} />}
            </div>
            <Card style={{ padding: 10, marginBottom: 8, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input value={s.hora} onChange={(e) => set(s.id, "hora", e.target.value)} placeholder="00:00" style={{ ...inputStyle, width: 64, fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, padding: "6px 8px", color: C.forest }} />
                <input value={s.momento} onChange={(e) => set(s.id, "momento", e.target.value)} placeholder="Momento" style={{ ...inputStyle, flex: 1, background: "transparent", border: "none", fontWeight: 600, padding: "6px 0" }} />
                <button onClick={() => del(s.id)} style={{ background: "none", border: "none", color: C.line, cursor: "pointer" }}><Trash2 size={15} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                <input value={s.lugar} onChange={(e) => set(s.id, "lugar", e.target.value)} placeholder="Lugar" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12.5 }} />
                <input value={s.nota} onChange={(e) => set(s.id, "nota", e.target.value)} placeholder="Responsable / nota" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12.5 }} />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Música ---------------- */
function Musica({ data, up }) {
  const [momento, setMomento] = useState(MOMENTOS[0]);
  const [cancion, setCancion] = useState("");
  const [artista, setArtista] = useState("");
  const add = () => { if (!cancion.trim()) return; up({ music: [...data.music, { id: uid(), momento, cancion: cancion.trim(), artista: artista.trim() }] }); setCancion(""); setArtista(""); };
  const del = (id) => up({ music: data.music.filter((m) => m.id !== id) });

  return (
    <div>
      <H sub="Vuestra banda sonora, por momentos.">Música</H>
      <Card style={{ padding: 12, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input value={cancion} onChange={(e) => setCancion(e.target.value)} placeholder="Canción" style={inputStyle} />
          <input value={artista} onChange={(e) => setArtista(e.target.value)} placeholder="Artista" style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Select value={momento} onChange={(e) => setMomento(e.target.value)} options={MOMENTOS} style={{ flex: 1 }} />
          <Btn onClick={add}><Plus size={16} /> Añadir</Btn>
        </div>
      </Card>
      {MOMENTOS.map((m) => {
        const items = data.music.filter((x) => x.momento === m);
        return (
          <div key={m} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: m === "No quiero que suene" ? C.no : C.ink, marginBottom: 8 }}>{m}</div>
            {items.length === 0 ? <div style={{ fontSize: 13, color: C.sub, fontStyle: "italic" }}>Sin canciones todavía.</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((x) => (
                  <Card key={x.id} style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <Music size={15} color={C.sage} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{x.cancion}</span>
                      {x.artista && <span style={{ color: C.sub, fontSize: 13 }}> · {x.artista}</span>}
                    </div>
                    <button onClick={() => del(x.id)} style={{ background: "none", border: "none", color: C.line, cursor: "pointer" }}><Trash2 size={15} /></button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Regalos ---------------- */
function Regalos({ data, up }) {
  const [editing, setEditing] = useState(null);
  const blank = { id: "", de: "", detalle: "", importe: 0, agradecido: false };
  const save = (g) => { if (!g.de.trim()) return; if (g.id) up({ gifts: data.gifts.map((x) => (x.id === g.id ? g : x)) }); else up({ gifts: [...data.gifts, { ...g, id: uid() }] }); setEditing(null); };
  const del = (id) => up({ gifts: data.gifts.filter((g) => g.id !== id) });
  const toggle = (id) => up({ gifts: data.gifts.map((g) => (g.id === id ? { ...g, agradecido: !g.agradecido } : g)) });
  const total = data.gifts.reduce((s, g) => s + num(g.importe), 0);
  const agr = data.gifts.filter((g) => g.agradecido).length;

  return (
    <div>
      <H sub={`${data.gifts.length} regalos · ${eur(total)} · ${agr} agradecidos`} action={<Btn onClick={() => setEditing({ ...blank })}><Plus size={16} /> Añadir</Btn>}>Regalos y sobres</H>
      {data.gifts.length === 0 ? (
        <Empty icon={Gift} title="Aún no hay regalos" hint="Apunta quién os regala qué (o cuánto) y marca cuando le hayáis dado las gracias." action={<Btn onClick={() => setEditing({ ...blank })}><Plus size={16} /> Añadir regalo</Btn>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.gifts.map((g) => (
            <Card key={g.id} style={{ padding: 12, display: "flex", alignItems: "center", gap: 11 }}>
              <button onClick={() => toggle(g.id)} title="Agradecido" style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", border: `2px solid ${g.agradecido ? C.sage : C.line}`, background: g.agradecido ? C.sage : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{g.agradecido && <Check size={14} color="#fff" strokeWidth={3} />}</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: C.ink }}>{g.de}</div>
                {g.detalle && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{g.detalle}</div>}
              </div>
              {num(g.importe) > 0 && <span style={{ fontWeight: 700, color: C.ok }}>{eur(g.importe)}</span>}
              <button onClick={() => setEditing(g)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer" }}><Pencil size={15} /></button>
            </Card>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Editar regalo" : "Nuevo regalo"} onClose={() => setEditing(null)}
          footer={<div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => save(editing)} style={{ flex: 1, justifyContent: "center" }}><Check size={16} /> Guardar</Btn>
            {editing.id && <Btn kind="danger" onClick={() => { del(editing.id); setEditing(null); }}><Trash2 size={16} /></Btn>}
          </div>}>
          {(() => { const f = (k, val) => setEditing((s) => ({ ...s, [k]: val })); const g = editing; return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="De parte de"><TextInput value={g.de} onChange={(e) => f("de", e.target.value)} placeholder="Ej.: Tíos Ana y Pedro" autoFocus /></Field>
              <Field label="Detalle (opcional)"><TextInput value={g.detalle} onChange={(e) => f("detalle", e.target.value)} placeholder="Sobre, vajilla, experiencia…" /></Field>
              <Field label="Importe (€, si es sobre)"><TextInput type="number" value={g.importe} onChange={(e) => f("importe", num(e.target.value))} /></Field>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={g.agradecido} onChange={(e) => f("agradecido", e.target.checked)} /> Ya le hemos dado las gracias
              </label>
            </div>
          ); })()}
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Ajustes ---------------- */
function Ajustes({ data, up, setData }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState("");
  const exportar = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "boda.json"; a.click(); URL.revokeObjectURL(url);
  };
  const importar = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { setData({ ...SEED, ...JSON.parse(reader.result) }); setMsg("Copia cargada correctamente."); } catch (err) { setMsg("Ese archivo no es una copia válida."); } };
    reader.readAsText(file);
  };

  return (
    <div>
      <H sub="Personaliza vuestra boda y guarda o comparte vuestros datos.">Ajustes</H>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nombres de la pareja"><TextInput value={data.settings.couple} onChange={(e) => up({ settings: { ...data.settings, couple: e.target.value } })} placeholder="David & …" /></Field>
          <Field label="Fecha de la boda"><TextInput type="date" value={data.settings.date} onChange={(e) => up({ settings: { ...data.settings, date: e.target.value } })} /></Field>
        </div>
      </Card>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <Eyebrow>Tus datos</Eyebrow>
        <p style={{ fontSize: 13.5, color: C.sub, margin: "8px 0 14px" }}>Todo se guarda automáticamente en este dispositivo. Puedes descargar una copia o cargar la de otra pareja para compartir la plantilla.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn kind="soft" onClick={exportar}><Download size={16} /> Descargar copia</Btn>
          <label><span style={{ fontFamily: BODY, fontWeight: 600, borderRadius: 999, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", fontSize: 14, background: C.sageSoft, color: C.forest }}>Cargar copia</span><input type="file" accept="application/json" onChange={importar} style={{ display: "none" }} /></label>
        </div>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: C.sage, fontWeight: 600 }}>{msg}</div>}
      </Card>
      {confirmReset ? (
        <Card style={{ padding: 14, border: `1px solid ${C.no}55` }}>
          <div style={{ fontSize: 13.5, color: C.ink, marginBottom: 10 }}>¿Seguro? Se borrarán todos los datos y volverá a la plantilla inicial.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="danger" onClick={() => { setData(SEED); setConfirmReset(false); }}><Trash2 size={16} /> Sí, empezar de cero</Btn>
            <Btn kind="ghost" onClick={() => setConfirmReset(false)}>Cancelar</Btn>
          </div>
        </Card>
      ) : <Btn kind="danger" onClick={() => setConfirmReset(true)}><Trash2 size={16} /> Empezar de cero</Btn>}
      <p style={{ fontSize: 12, color: C.sub, marginTop: 24, textAlign: "center" }}>Hecho con cariño para vuestro gran día.</p>
    </div>
  );
}
