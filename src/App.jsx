import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Wallet, Users, LayoutGrid, ListChecks, Settings,
  Heart, Plus, Trash2, Check, X, Search, Download, Pencil, Leaf,
  Truck, Receipt, Clock, Music, Gift, MoreHorizontal, Phone, Mail,
  ChevronRight, Copy, LogOut, Link2
} from "lucide-react";
import { FileSpreadsheet, Circle, Square, Move } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "./supabase.js";

const TIPOS=["Adulto","Cadete","Infantil"];
// Carga SheetJS desde CDN solo cuando se necesita (sin dependencia en package.json)
function loadXLSX(){return new Promise((res,rej)=>{if(window.XLSX)return res(window.XLSX);const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";s.onload=()=>res(window.XLSX);s.onerror=()=>rej(new Error("cdn"));document.head.appendChild(s);});}

const C={paper:"#F3F0E7",surface:"#FFFFFF",ink:"#2A2D24",sub:"#6C7060",sage:"#7E8A66",sageSoft:"#E7EADD",forest:"#3B4733",line:"#E4DFD2",gold:"#B08D57",blush:"#C2998F",ok:"#5F7E47",okBg:"#E6EEDB",no:"#B0644D",noBg:"#F3E1DA",pend:"#A98C4B",pendBg:"#F2EAD3"};
const DISPLAY="'Cormorant Garamond',Georgia,'Times New Roman',serif";
const BODY="'Inter',system-ui,-apple-system,sans-serif";
const eur=(n)=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(n)||0);
const uid=()=>Math.random().toString(36).slice(2,9);
const num=(v)=>(v===""||v==null?0:Number(v)||0);
const daysTo=(date)=>{if(!date)return null;const d=new Date(date+"T00:00:00");if(isNaN(d))return null;return Math.ceil((d-new Date().setHours(0,0,0,0))/86400000);};
const fmtDate=(s)=>{if(!s)return"";const d=new Date(s+"T00:00:00");if(isNaN(d))return"";return d.toLocaleDateString("es-ES",{day:"2-digit",month:"short"});};

const TASK_GROUPS=[
  ["12 meses antes",["Establecer el presupuesto","Crear lista de invitados preliminar","Definir el estilo o tema","Buscar y visitar lugares","Reservar el lugar y el banquete","Reservar fecha y hora de la ceremonia"]],
  ["10–11 meses antes",["Contratar fotografía y vídeo","Contratar catering y cerrar el menú","Contratar entretenimiento / DJ","Contratar decoración y floristería","Comenzar pruebas de vestido de novia","Decidir atuendos del cortejo"]],
  ["8–9 meses antes",["Finalizar lista de invitados","Comprar el vestido de novia","Comprar el traje del novio","Reservar transporte","Elegir el pastel","Encargar las invitaciones","Reservar peluquería y maquillaje"]],
  ["6–7 meses antes",["Reservar luna de miel","Decidir cortejo nupcial","Crear web de la boda","Fotos de pre-boda","Comprar las alianzas"]],
  ["3–5 meses antes",["Comprar detalles y recuerdos","Diseñar el seating plan","Prueba de menú","Confirmar minuta con proveedores","Crear lista de música"]],
  ["1–2 meses antes",["Enviar las invitaciones","Crear lista de regalos","Confirmar transporte de invitados","Última prueba de vestido y traje","Documentación de matrimonio"]],
  ["Última semana",["Confirmar nº final con el catering","Pagos finales a proveedores","Preparar kit de emergencia","Repartir tareas a maestros de ceremonia","Confirmar timing del día"]],
];
const PLAZOS=TASK_GROUPS.map(g=>g[0]);
const SEED_TASKS=TASK_GROUPS.flatMap(([plazo,items])=>items.map(titulo=>({id:uid(),titulo,plazo,hecho:false})));
const LADOS=["Novia","Novio","Ambos"];
const GRUPOS=["Familia","Amigos","Trabajo","Otros"];
const COMIDAS=["Carne","Pollo","Pescado","Vegetariano","Vegano","Menú niño"];
const RESTR=["Ninguna","Sin gluten","Vegetariana","Vegana","Sin lácteos","Sin nueces","Otra"];
const ESTADOS=[{v:"confirmado",label:"Confirmado",bg:C.okBg,fg:C.ok},{v:"pendiente",label:"Pendiente",bg:C.pendBg,fg:C.pend},{v:"rechazado",label:"No asiste",bg:C.noBg,fg:C.no}];
const CATS_PROV=["Catering / Banquete","Fotografía y vídeo","Música / DJ","Flores y decoración","Vestido / traje","Belleza y peluquería","Pastel","Transporte","Invitaciones","Joyería","Otros"];
const ESTADOS_PROV=["Por contactar","Presupuesto pedido","En negociación","Reservado","Pagado","Descartado"];
const PROV_COLOR={"Reservado":C.ok,"Pagado":C.ok,"En negociación":C.pend,"Presupuesto pedido":C.pend,"Por contactar":C.sub,"Descartado":C.no};
const MOMENTOS=["Ceremonia","Cóctel","Banquete","Primer baile","Fiesta","No quiero que suene"];
const SEED={
  settings:{couple:"Nuestra boda",date:""},objetivo:0,
  budget:["Lugar y banquete","Catering","Fotografía y vídeo","Música y DJ","Vestido de novia","Traje del novio","Estilismo y belleza","Flores y decoración","Invitaciones y papelería","Alianzas","Detalles y recuerdos","Pastel","Transporte","Luna de miel","Otros / imprevistos"].map(c=>({id:uid(),categoria:c,estimado:0,real:0,pagado:0})),
  guests:[],tables:Array.from({length:10},(_,i)=>({id:uid(),nombre:`Mesa ${i+1}`,capacidad:10})),tasks:SEED_TASKS,vendors:[],payments:[],
  schedule:[["10:00","Peluquería y maquillaje (novia)","",""],["11:30","Preparativos (novio)","",""],["12:30","Fotos de preparativos","",""],["13:30","Llegada de invitados","",""],["14:00","Ceremonia","",""],["14:45","Cóctel de bienvenida","",""],["16:00","Entrada al banquete","",""],["16:15","Banquete","",""],["18:30","Tarta y brindis","",""],["19:00","Primer baile","",""],["19:30","Apertura de barra libre","",""],["20:00","Fiesta / DJ","",""],["00:00","Recena","",""],["02:00","Fin de fiesta","",""]].map(([hora,momento,lugar,nota])=>({id:uid(),hora,momento,lugar,nota})),
  music:[],gifts:[],
};

// UI base
function Eyebrow({children}){return <div style={{fontFamily:BODY,fontSize:11,letterSpacing:".18em",textTransform:"uppercase",color:C.sage,fontWeight:600}}>{children}</div>;}
function Card({children,style,...props}){return <div {...props} style={{background:C.surface,border:`1px solid ${C.line}`,borderRadius:16,...style}}>{children}</div>;}
function Btn({children,onClick,kind="primary",style}){
  const base={fontFamily:BODY,fontWeight:600,borderRadius:999,cursor:"pointer",border:"1px solid transparent",display:"inline-flex",alignItems:"center",gap:6,transition:"all .15s",padding:"9px 16px",fontSize:14};
  const kinds={primary:{background:C.forest,color:"#fff"},soft:{background:C.sageSoft,color:C.forest},ghost:{background:"transparent",color:C.sub,border:`1px solid ${C.line}`},danger:{background:"transparent",color:C.no,border:`1px solid ${C.noBg}`}};
  return <button onClick={onClick} style={{...base,...kinds[kind],...style}}>{children}</button>;
}
function Field({label,children}){return <label style={{display:"block"}}><span style={{fontFamily:BODY,fontSize:12,color:C.sub,fontWeight:600,display:"block",marginBottom:4}}>{label}</span>{children}</label>;}
const IS={fontFamily:BODY,fontSize:14,color:C.ink,background:"#FBFAF6",border:`1px solid ${C.line}`,borderRadius:10,padding:"9px 11px",width:"100%",outline:"none",boxSizing:"border-box"};
function TI(p){return <input {...p} style={{...IS,...(p.style||{})}}/>;}
function Sel({value,onChange,options,style}){return <select value={value} onChange={onChange} style={{...IS,...style}}>{options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.label}</option>)}</select>;}
function Ring({value,max,color,caption}){const pct=max>0?Math.min(value/max,1):0;const r=32,c=2*Math.PI*r;return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}><div style={{position:"relative",width:84,height:84}}><svg width="84" height="84" style={{transform:"rotate(-90deg)"}}><circle cx="42" cy="42" r={r} fill="none" stroke={C.line} strokeWidth="7"/><circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-pct)} style={{transition:"stroke-dashoffset .6s ease"}}/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:DISPLAY,fontSize:22,fontWeight:600,color:C.ink,lineHeight:1}}>{Math.round(pct*100)}%</span></div></div><span style={{fontFamily:BODY,fontSize:12,color:C.sub,textAlign:"center"}}>{caption}</span></div>;}
function H({children,sub,action}){return <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:10,flexWrap:"wrap"}}><div><h1 style={{fontFamily:DISPLAY,fontSize:34,fontWeight:700,margin:0,color:C.ink,lineHeight:1.05}}>{children}</h1>{sub&&<p style={{margin:"6px 0 0",color:C.sub,fontSize:14}}>{sub}</p>}</div>{action}</div>;}
function Empty({icon:Icon,title,hint,action}){return <Card style={{padding:"44px 22px",textAlign:"center"}}><div style={{width:52,height:52,borderRadius:14,background:C.sageSoft,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Icon size={24} color={C.sage}/></div><div style={{fontFamily:DISPLAY,fontSize:22,fontWeight:600,color:C.ink}}>{title}</div><div style={{color:C.sub,fontSize:14,margin:"6px auto 16px",maxWidth:340}}>{hint}</div>{action}</Card>;}
function Modal({title,onClose,children,footer}){return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(40,40,30,.4)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50}}><div onClick={e=>e.stopPropagation()} style={{background:C.surface,width:"100%",maxWidth:460,borderRadius:"20px 20px 0 0",padding:20,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><span style={{fontFamily:DISPLAY,fontSize:24,fontWeight:700}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.sub}}><X size={22}/></button></div>{children}{footer&&<div style={{marginTop:18}}>{footer}</div>}</div></div>;}

// Splash
function Splash(){return <div style={{minHeight:"100vh",background:C.paper,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><div style={{width:64,height:64,borderRadius:16,background:C.forest,display:"flex",alignItems:"center",justifyContent:"center"}}><Heart size={30} color="#fff" fill="#fff"/></div><div style={{fontFamily:DISPLAY,fontSize:32,fontWeight:700,color:C.ink}}>Bódate</div><div style={{fontFamily:BODY,fontSize:14,color:C.sub}}>Cargando…</div></div>;}

// AuthScreen
function AuthScreen(){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);const [msg,setMsg]=useState("");const [err,setErr]=useState("");
  const ERRS={"Invalid login credentials":"Email o contraseña incorrectos.","User already registered":"Ese email ya tiene cuenta. Entra con tu contraseña.","Password should be at least 6 characters":"La contraseña debe tener mínimo 6 caracteres."};
  const submit=async()=>{
    if(!email.trim()||!pass.trim()){setErr("Rellena email y contraseña.");return;}
    setLoading(true);setErr("");setMsg("");
    try{
      if(mode==="login"){const{error}=await supabase.auth.signInWithPassword({email:email.trim(),password:pass});if(error)throw error;}
      else{const{error}=await supabase.auth.signUp({email:email.trim(),password:pass});if(error)throw error;setMsg("¡Cuenta creada! Ya puedes entrar.");setMode("login");}
    }catch(e){setErr(ERRS[e.message]||e.message);}finally{setLoading(false);}
  };
  return(
    <div style={{minHeight:"100vh",background:C.paper,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 18px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:32}}><div style={{width:64,height:64,borderRadius:16,background:C.forest,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Heart size={30} color="#fff" fill="#fff"/></div><div style={{fontFamily:DISPLAY,fontSize:42,fontWeight:700,color:C.ink,lineHeight:1}}>Bódate</div><div style={{fontFamily:BODY,fontSize:14,color:C.sub,marginTop:6}}>Organiza vuestra boda juntos</div></div>
        <Card style={{padding:24}}>
          <div style={{fontFamily:DISPLAY,fontSize:24,fontWeight:700,color:C.ink,marginBottom:18,textAlign:"center"}}>{mode==="login"?"Entrar":"Crear cuenta"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Field label="Email"><TI type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus/></Field>
            <Field label="Contraseña"><TI type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Mínimo 6 caracteres" onKeyDown={e=>e.key==="Enter"&&submit()}/></Field>
          </div>
          {err&&<div style={{marginTop:12,padding:"10px 12px",background:C.noBg,borderRadius:10,fontSize:13,color:C.no}}>{err}</div>}
          {msg&&<div style={{marginTop:12,padding:"10px 12px",background:C.okBg,borderRadius:10,fontSize:13,color:C.ok}}>{msg}</div>}
          <Btn onClick={submit} style={{marginTop:16,width:"100%",justifyContent:"center"}} kind={loading?"ghost":"primary"}>{loading?"Cargando…":mode==="login"?"Entrar":"Crear cuenta"}</Btn>
          <button onClick={()=>{setMode(m=>m==="login"?"register":"login");setErr("");setMsg("");}} style={{background:"none",border:"none",color:C.sage,fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",marginTop:12,fontFamily:BODY}}>{mode==="login"?"¿Primera vez? Crea una cuenta":"¿Ya tienes cuenta? Entra aquí"}</button>
        </Card>
        <div style={{textAlign:"center",fontSize:12,color:C.sub,marginTop:20,fontFamily:BODY}}>Los datos se guardan de forma segura en la nube.</div>
      </div>
    </div>
  );
}

// SetupScreen
function SetupScreen({user,onSetup}){
  const [modo,setModo]=useState(null);
  const [codigo,setCodigo]=useState("");const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
  const crear=async()=>{setLoading(true);setErr("");const{data,error}=await supabase.from("bodas").insert({owner_id:user.id,data:SEED}).select().single();if(error){setErr(error.message);setLoading(false);return;}onSetup(data);};
  const unirse=async()=>{
    if(codigo.trim().length<6){setErr("El código tiene 6 caracteres.");return;}
    setLoading(true);setErr("");
    try{
      const{data,error}=await supabase.rpc("join_boda",{p_codigo:codigo.trim().toUpperCase()});
      if(error)throw error;
      if(!data||data.length===0)throw new Error("not found");
      const{data:boda,error:e2}=await supabase.from("bodas").select("*").eq("id",data[0].boda_id).single();
      if(e2)throw e2;
      onSetup(boda);
    }catch(e){setErr("Código no encontrado. Pídele a tu pareja que lo compruebe.");setLoading(false);}
  };
  return(
    <div style={{minHeight:"100vh",background:C.paper,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 18px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{width:56,height:56,borderRadius:14,background:C.forest,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:10}}><Heart size={26} color="#fff" fill="#fff"/></div><div style={{fontFamily:DISPLAY,fontSize:36,fontWeight:700,color:C.ink,lineHeight:1}}>Bódate</div><div style={{fontFamily:BODY,fontSize:14,color:C.sub,marginTop:6}}>Hola, {user.email} 👋</div></div>
        {!modo&&(<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{padding:20,cursor:"pointer",border:`2px solid ${C.line}`}} onClick={()=>setModo("crear")}><div style={{fontFamily:DISPLAY,fontSize:22,fontWeight:700,color:C.ink,marginBottom:4}}>💍 Crear nuestra boda</div><div style={{fontSize:13.5,color:C.sub}}>Empieza desde cero. Recibirás un código para que tu pareja se una.</div></Card>
          <Card style={{padding:20,cursor:"pointer",border:`2px solid ${C.line}`}} onClick={()=>setModo("unirse")}><div style={{fontFamily:DISPLAY,fontSize:22,fontWeight:700,color:C.ink,marginBottom:4}}>🔗 Unirme a una boda</div><div style={{fontSize:13.5,color:C.sub}}>Entra con el código que te ha pasado tu pareja.</div></Card>
          <button onClick={()=>supabase.auth.signOut()} style={{background:"none",border:"none",color:C.sub,fontSize:12,cursor:"pointer",fontFamily:BODY,marginTop:4}}>Cerrar sesión</button>
        </div>)}
        {modo==="crear"&&(<Card style={{padding:24}}><div style={{fontFamily:DISPLAY,fontSize:22,fontWeight:700,color:C.ink,marginBottom:6}}>Crear vuestra boda</div><div style={{fontSize:13.5,color:C.sub,marginBottom:18}}>Se creará vuestra boda en la nube y recibirás un código para compartir con tu pareja.</div>{err&&<div style={{padding:"10px 12px",background:C.noBg,borderRadius:10,fontSize:13,color:C.no,marginBottom:12}}>{err}</div>}<div style={{display:"flex",gap:8}}><Btn onClick={crear} style={{flex:1,justifyContent:"center"}}>{loading?"Creando…":"Crear boda"}</Btn><Btn kind="ghost" onClick={()=>setModo(null)}>Volver</Btn></div></Card>)}
        {modo==="unirse"&&(<Card style={{padding:24}}><div style={{fontFamily:DISPLAY,fontSize:22,fontWeight:700,color:C.ink,marginBottom:6}}>Unirme a una boda</div><div style={{fontSize:13.5,color:C.sub,marginBottom:14}}>Escribe el código de 6 letras que encontrarás en Ajustes de la app de tu pareja.</div><Field label="Código de boda"><TI value={codigo} onChange={e=>setCodigo(e.target.value.toUpperCase())} placeholder="Ej: AB12CD" maxLength={6} style={{textTransform:"uppercase",letterSpacing:".2em",fontWeight:700,fontSize:18,textAlign:"center"}} autoFocus onKeyDown={e=>e.key==="Enter"&&unirse()}/></Field>{err&&<div style={{padding:"10px 12px",background:C.noBg,borderRadius:10,fontSize:13,color:C.no,marginTop:10}}>{err}</div>}<div style={{display:"flex",gap:8,marginTop:14}}><Btn onClick={unirse} style={{flex:1,justifyContent:"center"}}>{loading?"Buscando…":"Unirme"}</Btn><Btn kind="ghost" onClick={()=>setModo(null)}>Volver</Btn></div></Card>)}
      </div>
    </div>
  );
}

// Nav
const NAV=[{k:"resumen",label:"Resumen",icon:LayoutDashboard,group:null},{k:"invitados",label:"Invitados",icon:Users,group:"Planificación"},{k:"mesas",label:"Mesas",icon:LayoutGrid,group:"Planificación"},{k:"tareas",label:"Tareas",icon:ListChecks,group:"Planificación"},{k:"cronograma",label:"Cronograma",icon:Clock,group:"El día"},{k:"musica",label:"Música",icon:Music,group:"El día"},{k:"regalos",label:"Regalos",icon:Gift,group:"El día"},{k:"presupuesto",label:"Presupuesto",icon:Wallet,group:"Dinero"},{k:"pagos",label:"Pagos",icon:Receipt,group:"Dinero"},{k:"proveedores",label:"Proveedores",icon:Truck,group:"Dinero"},{k:"ajustes",label:"Ajustes",icon:Settings,group:null}];
const MP=["resumen","invitados","tareas","presupuesto"];

// App
export default function App(){
  const [session,setSession]=useState(null);
  const [bodaId,setBodaId]=useState(null);const [codigo,setCodigo]=useState("");
  const [data,setData]=useState(SEED);const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("resumen");const [saved,setSaved]=useState(false);const [moreOpen,setMoreOpen]=useState(false);
  const saveTimer=useRef(null);const isSaving=useRef(false);const lastSaveAt=useRef(0);const ch=useRef(null);

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session:s}})=>{setSession(s);if(s)await loadBoda(s.user.id);setLoading(false);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(event,s)=>{setSession(s);if(s&&event==="SIGNED_IN"){setLoading(true);await loadBoda(s.user.id);setLoading(false);}if(!s){setBodaId(null);setData(SEED);if(ch.current)supabase.removeChannel(ch.current);}});
    return()=>subscription.unsubscribe();
  },[]);

  const loadBoda=async(uid)=>{
    const{data:own}=await supabase.from("bodas").select("*").eq("owner_id",uid).maybeSingle();
    if(own){applyBoda(own);return;}
    const{data:mem}=await supabase.from("boda_members").select("boda_id").eq("user_id",uid).maybeSingle();
    if(mem){const{data:b}=await supabase.from("bodas").select("*").eq("id",mem.boda_id).maybeSingle();if(b){applyBoda(b);return;}}
  };

  const applyBoda=(b)=>{
    setBodaId(b.id);setCodigo(b.codigo);setData({...SEED,...(b.data||{})});
    if(ch.current)supabase.removeChannel(ch.current);
    ch.current=supabase.channel(`boda:${b.id}`).on("postgres_changes",{event:"UPDATE",schema:"public",table:"bodas",filter:`id=eq.${b.id}`},(p)=>{if(isSaving.current||Date.now()-lastSaveAt.current<2000)return;setData({...SEED,...(p.new.data||{})});}).subscribe();
  };

  useEffect(()=>{
    if(!bodaId)return;clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{isSaving.current=true;await supabase.from("bodas").update({data}).eq("id",bodaId);lastSaveAt.current=Date.now();setSaved(true);setTimeout(()=>setSaved(false),1200);isSaving.current=false;},1500);
    return()=>clearTimeout(saveTimer.current);
  },[data,bodaId]);

  const up=(patch)=>setData(d=>({...d,...patch}));
  const goto=(k)=>{setTab(k);setMoreOpen(false);};
  const signOut=()=>supabase.auth.signOut();

  if(loading)return <Splash/>;
  if(!session)return <AuthScreen/>;
  if(!bodaId)return <SetupScreen user={session.user} onSetup={applyBoda}/>;

  let lg="__";
  return(
    <div style={{minHeight:"100vh",background:C.paper,color:C.ink,fontFamily:BODY}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box}input,select,button{font-family:inherit}::-webkit-scrollbar{width:9px}::-webkit-scrollbar-thumb{background:#d8d2c4;border-radius:9px}`}</style>
      <div style={{display:"flex",minHeight:"100vh"}}>
        <aside className="hidden md:flex" style={{width:236,borderRight:`1px solid ${C.line}`,background:"#FAF8F2",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <Brand couple={data.settings.couple} date={data.settings.date}/>
          <nav style={{padding:"8px 12px",display:"flex",flexDirection:"column",gap:2}}>
            {NAV.map(n=>{const sg=n.group&&n.group!==lg;lg=n.group||lg;const a=tab===n.k;return(<React.Fragment key={n.k}>{sg&&<div style={{fontSize:10.5,letterSpacing:".14em",textTransform:"uppercase",color:C.sub,fontWeight:700,padding:"12px 12px 4px"}}>{n.group}</div>}<button onClick={()=>goto(n.k)} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 12px",borderRadius:11,cursor:"pointer",border:"none",textAlign:"left",fontSize:14.5,fontWeight:a?700:500,background:a?C.sageSoft:"transparent",color:a?C.forest:C.sub}}><n.icon size={18}/>{n.label}</button></React.Fragment>);})}
          </nav>
          <div style={{marginTop:"auto",padding:16}}><SaveDot saved={saved}/></div>
        </aside>
        <main style={{flex:1,minWidth:0,paddingBottom:92}}>
          <header className="md:hidden" style={{position:"sticky",top:0,zIndex:20}}><Brand couple={data.settings.couple} date={data.settings.date} mobile/></header>
          <div style={{maxWidth:1000,margin:"0 auto",padding:"26px 18px 40px"}}>
            {tab==="resumen"&&<Resumen data={data} go={goto}/>}
            {tab==="presupuesto"&&<Presupuesto data={data} up={up}/>}
            {tab==="invitados"&&<Invitados data={data} up={up}/>}
            {tab==="mesas"&&<Mesas data={data} up={up}/>}
            {tab==="tareas"&&<Tareas data={data} up={up}/>}
            {tab==="proveedores"&&<Proveedores data={data} up={up}/>}
            {tab==="pagos"&&<Pagos data={data} up={up}/>}
            {tab==="cronograma"&&<Cronograma data={data} up={up}/>}
            {tab==="musica"&&<Musica data={data} up={up}/>}
            {tab==="regalos"&&<Regalos data={data} up={up}/>}
            {tab==="ajustes"&&<Ajustes data={data} up={up} setData={setData} codigo={codigo} bodaId={bodaId} signOut={signOut}/>}
          </div>
        </main>
      </div>
      <nav className="md:hidden" style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(250,248,242,.96)",borderTop:`1px solid ${C.line}`,display:"flex",padding:"6px 4px 10px",backdropFilter:"blur(8px)",zIndex:30}}>
        {MP.map(k=>{const n=NAV.find(x=>x.k===k);const a=tab===k;return(<button key={k} onClick={()=>goto(k)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:a?C.forest:C.sub,cursor:"pointer",flex:1}}><n.icon size={21} strokeWidth={a?2.4:1.8}/><span style={{fontSize:10.5,fontWeight:a?700:500}}>{n.label}</span></button>);})}
        <button onClick={()=>setMoreOpen(true)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:moreOpen?C.forest:C.sub,cursor:"pointer",flex:1}}><MoreHorizontal size={21}/><span style={{fontSize:10.5}}>Más</span></button>
      </nav>
      {moreOpen&&(<div className="md:hidden" onClick={()=>setMoreOpen(false)} style={{position:"fixed",inset:0,background:"rgba(40,40,30,.45)",zIndex:40,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:C.surface,width:"100%",borderRadius:"20px 20px 0 0",padding:"16px 14px 28px",maxHeight:"80vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontFamily:DISPLAY,fontSize:22,fontWeight:700}}>Todas las secciones</span><button onClick={()=>setMoreOpen(false)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer"}}><X size={22}/></button></div>{NAV.map(n=>(<button key={n.k} onClick={()=>goto(n.k)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px",borderRadius:12,border:"none",background:tab===n.k?C.sageSoft:"transparent",color:tab===n.k?C.forest:C.ink,cursor:"pointer",fontSize:15.5,fontWeight:tab===n.k?700:500,textAlign:"left"}}><n.icon size={19} color={tab===n.k?C.forest:C.sage}/><span style={{flex:1}}>{n.label}</span>{n.group&&<span style={{fontSize:11,color:C.sub}}>{n.group}</span>}<ChevronRight size={16} color={C.line}/></button>))}</div></div>)}
    </div>
  );
}

function Brand({couple,date,mobile}){
  const dias=daysTo(date);
  return(<div style={{padding:mobile?"12px 16px":"20px 18px 14px",borderBottom:`1px solid ${C.line}`,background:mobile?"rgba(250,248,242,.96)":"transparent",backdropFilter:mobile?"blur(8px)":"none",display:"flex",alignItems:"center",gap:10}}>
    <div style={{width:34,height:34,borderRadius:9,background:C.forest,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Heart size={18} color="#fff" fill="#fff"/></div>
    <div style={{minWidth:0}}><div style={{fontFamily:DISPLAY,fontSize:21,fontWeight:700,lineHeight:1,color:C.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{couple||"Nuestra boda"}</div><div style={{fontSize:11.5,color:C.sage,fontWeight:600,marginTop:3}}>{dias==null?"Pon vuestra fecha en Ajustes":dias>0?`Faltan ${dias} días`:dias===0?"¡Es hoy! 🎉":"¡Recién casados!"}</div></div>
  </div>);
}
function SaveDot({saved}){return <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:saved?C.ok:C.sub,transition:"color .3s"}}><span style={{width:7,height:7,borderRadius:99,background:saved?C.ok:C.line}}/>{saved?"Guardado ☁️":"Sincronizado"}</div>;}

// Resumen
function Resumen({data,go}){
  const real=data.budget.reduce((s,b)=>s+num(b.real),0);const pagado=data.budget.reduce((s,b)=>s+num(b.pagado),0);
  const conf=data.guests.filter(g=>g.estado==="confirmado").length;const hechas=data.tasks.filter(t=>t.hecho).length;
  const dias=daysTo(data.settings.date);const recaudado=data.gifts.reduce((s,g)=>s+num(g.importe),0);
  const cubiertos=conf||data.guests.length;const porCubierto=cubiertos?Math.round(real/cubiertos):0;
  const pie=useMemo(()=>{const arr=data.budget.filter(b=>num(b.real)>0).map(b=>({name:b.categoria,value:num(b.real)})).sort((a,b)=>b.value-a.value);const top=arr.slice(0,6);const r=arr.slice(6).reduce((s,x)=>s+x.value,0);if(r>0)top.push({name:"Otros",value:r});return top;},[data.budget]);
  const PAL=[C.forest,C.sage,C.gold,C.blush,"#9AA77F","#C8B27E","#A9876F"];
  const ptareas=data.tasks.filter(t=>!t.hecho).slice(0,4);
  const ppagos=data.payments.filter(p=>!p.pagado).sort((a,b)=>(a.fecha||"9").localeCompare(b.fecha||"9")).slice(0,4);
  return(<div>
    <H sub="Todo vuestro día, en un vistazo.">Resumen</H>
    <Card style={{padding:"26px 22px",marginBottom:16,background:"linear-gradient(135deg,#FBFAF5,#EFEFE4)",position:"relative",overflow:"hidden"}}>
      <Leaf size={140} color={C.sageSoft} style={{position:"absolute",right:-24,bottom:-34,transform:"rotate(-18deg)"}}/>
      <div style={{position:"relative"}}><Eyebrow>Cuenta atrás</Eyebrow><div style={{display:"flex",alignItems:"baseline",gap:12,marginTop:6}}><span style={{fontFamily:DISPLAY,fontSize:64,fontWeight:700,color:C.forest,lineHeight:.9}}>{dias==null?"—":Math.abs(dias)}</span><span style={{fontSize:16,color:C.sub}}>{dias==null?"días (añade la fecha en Ajustes)":dias>0?"días para el gran día":dias===0?"¡es hoy!":"días desde la boda"}</span></div></div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
      <Card style={{padding:16,display:"flex",justifyContent:"center"}}><Ring value={conf} max={data.guests.length} color={C.sage} caption={`${conf}/${data.guests.length} confirmados`}/></Card>
      <Card style={{padding:16,display:"flex",justifyContent:"center"}}><Ring value={real} max={data.objetivo||1} color={C.gold} caption={`${eur(real)} de ${eur(data.objetivo)}`}/></Card>
      <Card style={{padding:16,display:"flex",justifyContent:"center"}}><Ring value={hechas} max={data.tasks.length} color={C.forest} caption={`${hechas}/${data.tasks.length} tareas`}/></Card>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12,marginBottom:16}}>
      <Card style={{padding:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><Eyebrow>Próximas tareas</Eyebrow><button onClick={()=>go("tareas")} style={{background:"none",border:"none",color:C.sage,fontWeight:600,fontSize:12.5,cursor:"pointer"}}>Ver todas</button></div>{ptareas.length===0?<div style={{fontSize:13,color:C.sub}}>¡Todo hecho! 🎉</div>:ptareas.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",fontSize:13.5}}><span style={{width:6,height:6,borderRadius:99,background:C.sage,flexShrink:0}}/><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.titulo}</span><span style={{fontSize:11,color:C.sub}}>{t.plazo}</span></div>))}</Card>
      <Card style={{padding:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><Eyebrow>Próximos pagos</Eyebrow><button onClick={()=>go("pagos")} style={{background:"none",border:"none",color:C.sage,fontWeight:600,fontSize:12.5,cursor:"pointer"}}>Ver todos</button></div>{ppagos.length===0?<div style={{fontSize:13,color:C.sub}}>No hay pagos pendientes.</div>:ppagos.map(p=>(<div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",fontSize:13.5}}><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.concepto}</span>{p.fecha&&<span style={{fontSize:11,color:C.gold,fontWeight:600}}>{fmtDate(p.fecha)}</span>}<span style={{fontWeight:700}}>{eur(p.importe)}</span></div>))}</Card>
    </div>
    <Card style={{padding:18}}>
      <Eyebrow>Gastos por categoría</Eyebrow>
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:14,marginTop:8}}>
        <div style={{width:150,height:150}}>{pie.length?<ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">{pie.map((_,i)=><Cell key={i} fill={PAL[i%PAL.length]}/>)}</Pie></PieChart></ResponsiveContainer>:<div style={{color:C.sub,fontSize:13,paddingTop:50,textAlign:"center"}}>Sin datos</div>}</div>
        <div style={{flex:1,minWidth:180}}>{pie.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,padding:"3px 0"}}><span style={{width:10,height:10,borderRadius:3,background:PAL[i%PAL.length],flexShrink:0}}/><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span><span style={{color:C.sub,fontWeight:600}}>{eur(p.value)}</span></div>))}</div>
      </div>
      <div style={{display:"flex",gap:18,marginTop:14,paddingTop:14,borderTop:`1px solid ${C.line}`,fontSize:13,flexWrap:"wrap"}}>
        <span style={{color:C.sub}}>Pagado: <b style={{color:C.ink}}>{eur(pagado)}</b></span>
        <span style={{color:C.sub}}>Pendiente: <b style={{color:C.ink}}>{eur(real-pagado)}</b></span>
        <span style={{color:C.sub}}>Coste/cubierto: <b style={{color:C.ink}}>{eur(porCubierto)}</b></span>
        {recaudado>0&&<span style={{color:C.sub}}>Regalos: <b style={{color:C.ok}}>{eur(recaudado)}</b></span>}
      </div>
    </Card>
  </div>);
}

// Presupuesto
function Presupuesto({data,up}){
  const set=(id,f,v)=>up({budget:data.budget.map(b=>b.id===id?{...b,[f]:v}:b)});
  const add=()=>up({budget:[...data.budget,{id:uid(),categoria:"Nueva partida",estimado:0,real:0,pagado:0}]});
  const del=(id)=>up({budget:data.budget.filter(b=>b.id!==id)});
  const tR=data.budget.reduce((s,b)=>s+num(b.real),0);const tP=data.budget.reduce((s,b)=>s+num(b.pagado),0);
  return(<div>
    <H sub="Edita cada partida. Los totales se calculan solos.">Presupuesto</H>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
      <Stat label="Presupuesto objetivo" value={eur(data.objetivo)} editable onChange={v=>up({objetivo:num(v)})} raw={data.objetivo}/>
      <Stat label="Coste real total" value={eur(tR)}/><Stat label="Pagado" value={eur(tP)} accent={C.ok}/><Stat label="Pendiente de pago" value={eur(tR-tP)} accent={C.no}/>
    </div>
    <div style={{marginBottom:14,fontSize:13,color:C.sub}}>Restante sobre objetivo: <b style={{color:data.objetivo-tR>=0?C.ok:C.no}}>{eur(data.objetivo-tR)}</b></div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {data.budget.map(b=>{const rest=num(b.real)-num(b.pagado);return(<Card key={b.id} style={{padding:12}}>
        <input value={b.categoria} onChange={e=>set(b.id,"categoria",e.target.value)} style={{...IS,background:"transparent",border:"none",fontWeight:600,fontSize:14.5,padding:"2px 0",marginBottom:8}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}><MN label="Estimado" value={b.estimado} onChange={v=>set(b.id,"estimado",v)}/><MN label="Coste real" value={b.real} onChange={v=>set(b.id,"real",v)}/><MN label="Pagado" value={b.pagado} onChange={v=>set(b.id,"pagado",v)}/></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}><span style={{fontSize:12.5,color:C.sub}}>Pendiente: <b style={{color:rest>0?C.no:C.ok}}>{eur(rest)}</b></span><button onClick={()=>del(b.id)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12.5}}><Trash2 size={14}/> Quitar</button></div>
      </Card>);})}
    </div>
    <Btn kind="soft" onClick={add} style={{marginTop:12}}><Plus size={16}/> Añadir partida</Btn>
  </div>);
}
function Stat({label,value,accent,editable,onChange,raw}){return <Card style={{padding:14}}><div style={{fontSize:12,color:C.sub,fontWeight:600}}>{label}</div>{editable?<input type="number" value={raw} onChange={e=>onChange(e.target.value)} style={{...IS,background:"transparent",border:"none",padding:"2px 0",fontFamily:DISPLAY,fontSize:26,fontWeight:700,color:accent||C.ink}}/>:<div style={{fontFamily:DISPLAY,fontSize:26,fontWeight:700,color:accent||C.ink,marginTop:2}}>{value}</div>}</Card>;}
function MN({label,value,onChange}){return <div><div style={{fontSize:11,color:C.sub,marginBottom:3}}>{label}</div><input type="number" value={value} onChange={e=>onChange(e.target.value)} style={{...IS,padding:"7px 8px",fontSize:13}}/></div>;}

// Invitados
function Invitados({data,up}){
  const [q,setQ]=useState("");const [f,setF]=useState("todos");const [ed,setEd]=useState(null);const [bulk,setBulk]=useState(false);const [bt,setBt]=useState("");const [imp,setImp]=useState(null);
  const fileRef=useRef(null);
  const blank={id:"",nombre:"",lado:"Ambos",grupo:"Amigos",estado:"pendiente",mesa:"",comida:"Carne",restriccion:"Ninguna",tipo:"",notas:""};
  const cnt={total:data.guests.length,confirmado:data.guests.filter(g=>g.estado==="confirmado").length,pendiente:data.guests.filter(g=>g.estado==="pendiente").length,rechazado:data.guests.filter(g=>g.estado==="rechazado").length};
  const tc={Adulto:0,Cadete:0,Infantil:0};data.guests.forEach(g=>{if(g.tipo&&tc[g.tipo]!=null)tc[g.tipo]++;});
  const hayTipos=tc.Adulto+tc.Cadete+tc.Infantil>0;
  const list=data.guests.filter(g=>(f==="todos"||g.estado===f)&&g.nombre.toLowerCase().includes(q.toLowerCase()));
  const save=(g)=>{if(!g.nombre.trim())return;if(g.id)up({guests:data.guests.map(x=>x.id===g.id?g:x)});else up({guests:[...data.guests,{...g,id:uid()}]});setEd(null);};
  const del=(id)=>up({guests:data.guests.filter(g=>g.id!==id)});
  const cycle=(g)=>{const o=["confirmado","pendiente","rechazado"];up({guests:data.guests.map(x=>x.id===g.id?{...x,estado:o[(o.indexOf(g.estado)+1)%3]}:x)});};
  const addBulk=()=>{const n=bt.split("\n").map(s=>s.trim()).filter(Boolean).map(nombre=>({...blank,id:uid(),nombre}));if(n.length)up({guests:[...data.guests,...n]});setBt("");setBulk(false);};
  const mapMenu=(s)=>{const t=s.toLowerCase();if(t.startsWith("adult"))return"Adulto";if(t.startsWith("cadet"))return"Cadete";if(t.startsWith("xiquet")||t.startsWith("infant")||t.startsWith("niñ")||t.startsWith("nin")||t.startsWith("ticket"))return"Infantil";return"";};
  const SKIP=["nombre","nom","invitado","invitados","convidat","convidats","menú","menu","tipo","numero","número","núm","nº","n"];
  const importExcel=async(e)=>{
    const file=e.target.files&&e.target.files[0];if(!file){return;}
    try{
      const XLSX=await loadXLSX();
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,blankrows:false});
      const nuevos=[];
      rows.forEach(r=>{
        let nombre="",tipo="",numero="";
        (r||[]).forEach(cell=>{const s=String(cell==null?"":cell).trim();if(!s)return;
          if(!tipo){const m=mapMenu(s);if(m){tipo=m;return;}}
          if(!numero&&/^\d+$/.test(s)){numero=s;return;}
          if(s.length>nombre.length)nombre=s;});
        if(!nombre||SKIP.includes(nombre.toLowerCase()))return;
        nuevos.push({...blank,id:uid(),nombre,tipo,notas:numero?`Nº ${numero}`:""});
      });
      if(nuevos.length){up({guests:[...data.guests,...nuevos]});setImp(nuevos.length);}else{setImp(0);}
    }catch(err){setImp(-1);}
    e.target.value="";
  };
  const plantilla=async()=>{const XLSX=await loadXLSX();const ws=XLSX.utils.aoa_to_sheet([["Número","Nombre","Menú"],[1,"Marta López","adult"],[2,"Avi Carmen","cadet"],[3,"Leo","xiquet"]]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Invitados");XLSX.writeFile(wb,"plantilla-invitados.xlsx");};
  return(<div>
    <H sub={`${cnt.total} invitados · ${cnt.confirmado} confirmados · ${cnt.pendiente} pendientes`}>Invitados</H>
    {hayTipos&&<div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <span style={{fontSize:12.5,fontWeight:700,color:"#fff",background:C.forest,borderRadius:999,padding:"4px 12px"}}>Adultos: {tc.Adulto}</span>
      <span style={{fontSize:12.5,fontWeight:700,color:"#fff",background:C.sage,borderRadius:999,padding:"4px 12px"}}>Cadetes: {tc.Cadete}</span>
      <span style={{fontSize:12.5,fontWeight:700,color:C.forest,background:C.sageSoft,borderRadius:999,padding:"4px 12px"}}>Infantiles: {tc.Infantil}</span>
    </div>}
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:1,minWidth:160}}><Search size={16} color={C.sub} style={{position:"absolute",left:11,top:11}}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar invitado…" style={{...IS,paddingLeft:34}}/></div>
      <Btn kind="ghost" onClick={()=>fileRef.current&&fileRef.current.click()}><FileSpreadsheet size={16}/> Importar Excel</Btn>
      <Btn kind="ghost" onClick={()=>setBulk(v=>!v)}>Añadir varios</Btn>
      <Btn onClick={()=>setEd({...blank})}><Plus size={16}/> Añadir</Btn>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} style={{display:"none"}}/>
    </div>
    {imp!=null&&<div style={{marginBottom:12,padding:"10px 12px",borderRadius:10,fontSize:13,fontWeight:600,background:imp>0?C.okBg:C.noBg,color:imp>0?C.ok:C.no}}>{imp>0?`✓ ${imp} invitados importados`:imp===0?"No se encontraron invitados en el archivo.":"No se pudo leer el archivo. Prueba a guardarlo como .xlsx o .csv."} <button onClick={()=>setImp(null)} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",marginLeft:6,fontWeight:700}}>✕</button></div>}
    {bulk&&<Card style={{padding:12,marginBottom:12}}><div style={{fontSize:12.5,color:C.sub,marginBottom:8}}>Un nombre por línea. O <button onClick={plantilla} style={{background:"none",border:"none",color:C.sage,fontWeight:700,cursor:"pointer",padding:0,textDecoration:"underline"}}>descarga la plantilla de Excel</button> para importar con menú.</div><textarea value={bt} onChange={e=>setBt(e.target.value)} rows={5} placeholder={"Marta López\nJuan Pérez"} style={{...IS,resize:"vertical"}}/><div style={{display:"flex",gap:8,marginTop:8}}><Btn onClick={addBulk}><Check size={16}/> Añadir</Btn><Btn kind="ghost" onClick={()=>setBulk(false)}>Cancelar</Btn></div></Card>}
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>{[["todos","Todos",cnt.total],["confirmado","Confirmados",cnt.confirmado],["pendiente","Pendientes",cnt.pendiente],["rechazado","No asisten",cnt.rechazado]].map(([k,l,n])=>(<button key={k} onClick={()=>setF(k)} style={{border:`1px solid ${f===k?C.forest:C.line}`,background:f===k?C.forest:"transparent",color:f===k?"#fff":C.sub,borderRadius:999,padding:"6px 12px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{l} · {n}</button>))}</div>
    {list.length===0?<Empty icon={Users} title="Aún no hay invitados" hint="Añade a vuestros invitados o importa tu Excel (columnas: Número, Nombre, Menú)." action={<Btn onClick={()=>setEd({...blank})}><Plus size={16}/> Añadir el primero</Btn>}/>:(
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{list.map(g=>{const est=ESTADOS.find(e=>e.v===g.estado);const mesa=data.tables.find(t=>t.id===g.mesa);return(<Card key={g.id} style={{padding:12,display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:15}}>{g.nombre}</div><div style={{fontSize:12,color:C.sub,marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>{g.tipo&&<span style={{color:C.forest,fontWeight:700}}>{g.tipo}</span>}<span>{g.lado} · {g.grupo}</span>{mesa&&<span>· {mesa.nombre}</span>}<span>· {g.comida}</span>{g.restriccion!=="Ninguna"&&<span style={{color:C.gold}}>· {g.restriccion}</span>}</div></div><button onClick={()=>cycle(g)} style={{border:"none",cursor:"pointer",background:est.bg,color:est.fg,fontWeight:700,fontSize:12,borderRadius:999,padding:"5px 10px",whiteSpace:"nowrap"}}>{est.label}</button><button onClick={()=>setEd(g)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer"}}><Pencil size={16}/></button></Card>);})}</div>
    )}
    {ed&&<Modal title={ed.id?"Editar invitado":"Nuevo invitado"} onClose={()=>setEd(null)} footer={<div style={{display:"flex",gap:8}}><Btn onClick={()=>save(ed)} style={{flex:1,justifyContent:"center"}}><Check size={16}/> Guardar</Btn>{ed.id&&<Btn kind="danger" onClick={()=>{del(ed.id);setEd(null);}}><Trash2 size={16}/></Btn>}</div>}><GF g={ed} setG={setEd} tables={data.tables}/></Modal>}
  </div>);
}
function GF({g,setG,tables}){
  const f=(k,v)=>setG(s=>({...s,[k]:v}));
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <Field label="Nombre y apellidos"><TI value={g.nombre} onChange={e=>f("nombre",e.target.value)} placeholder="Ej.: Marta López" autoFocus/></Field>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Tipo"><Sel value={g.tipo||""} onChange={e=>f("tipo",e.target.value)} options={[{v:"",label:"(sin tipo)"},...TIPOS]}/></Field><Field label="Mesa"><Sel value={g.mesa} onChange={e=>f("mesa",e.target.value)} options={[{v:"",label:"Sin asignar"},...tables.map(t=>({v:t.id,label:t.nombre}))]}/></Field></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Lado"><Sel value={g.lado} onChange={e=>f("lado",e.target.value)} options={LADOS}/></Field><Field label="Grupo"><Sel value={g.grupo} onChange={e=>f("grupo",e.target.value)} options={GRUPOS}/></Field></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Menú"><Sel value={g.comida} onChange={e=>f("comida",e.target.value)} options={COMIDAS}/></Field><Field label="Restricción"><Sel value={g.restriccion} onChange={e=>f("restriccion",e.target.value)} options={RESTR}/></Field></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Estado"><Sel value={g.estado} onChange={e=>f("estado",e.target.value)} options={ESTADOS}/></Field><Field label="Notas"><TI value={g.notas} onChange={e=>f("notas",e.target.value)} placeholder="Alergias…"/></Field></div>
  </div>;
}

// Mesas
function Mesas({data,up}){
  const [vista,setVista]=useState("lista");
  const add=()=>up({tables:[...data.tables,{id:uid(),nombre:`Mesa ${data.tables.length+1}`,capacidad:10}]});
  const del=(id)=>up({tables:data.tables.filter(t=>t.id!==id),guests:data.guests.map(g=>g.mesa===id?{...g,mesa:""}:g)});
  const set=(id,f,v)=>up({tables:data.tables.map(t=>t.id===id?{...t,[f]:v}:t)});
  const asgn=(gid,tid)=>up({guests:data.guests.map(g=>g.id===gid?{...g,mesa:tid}:g)});
  const sin=data.guests.filter(g=>!g.mesa);
  return(<div>
    <H sub="Crea mesas y reparte a los invitados." action={
      <div style={{display:"flex",background:C.sageSoft,borderRadius:999,padding:3}}>
        {[["lista","Lista"],["plano","Plano"]].map(([k,l])=>(<button key={k} onClick={()=>setVista(k)} style={{border:"none",cursor:"pointer",borderRadius:999,padding:"7px 16px",fontSize:13.5,fontWeight:700,background:vista===k?C.forest:"transparent",color:vista===k?"#fff":C.forest}}>{l}</button>))}
      </div>}>Mesas</H>
    {vista==="plano"?<Plano data={data} up={up}/>:(<>
      {sin.length>0&&<Card style={{padding:14,marginBottom:14,background:C.pendBg}}><div style={{fontWeight:700,fontSize:13.5,marginBottom:8}}>Sin mesa asignada ({sin.length})</div><div style={{display:"flex",flexDirection:"column",gap:6}}>{sin.map(g=>(<div key={g.id} style={{display:"flex",alignItems:"center",gap:8}}><span style={{flex:1,fontSize:13.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.nombre}</span><Sel value="" onChange={e=>asgn(g.id,e.target.value)} style={{width:150,padding:"6px 8px",fontSize:13}} options={[{v:"",label:"Asignar a…"},...data.tables.map(t=>({v:t.id,label:t.nombre}))]}/></div>))}</div></Card>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
        {data.tables.map(t=>{const occ=data.guests.filter(g=>g.mesa===t.id);const full=occ.length>=num(t.capacidad);return(<Card key={t.id} style={{padding:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><input value={t.nombre} onChange={e=>set(t.id,"nombre",e.target.value)} style={{...IS,background:"transparent",border:"none",fontFamily:DISPLAY,fontSize:19,fontWeight:700,padding:0,width:"60%"}}/><button onClick={()=>del(t.id)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer"}}><Trash2 size={15}/></button></div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:12.5,color:full?C.no:C.sage,fontWeight:700}}>{occ.length}</span><span style={{fontSize:12.5,color:C.sub}}>/</span><input type="number" value={t.capacidad} onChange={e=>set(t.id,"capacidad",num(e.target.value))} style={{...IS,width:48,padding:"3px 6px",fontSize:12.5}}/><span style={{fontSize:12.5,color:C.sub}}>asientos</span></div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>{occ.length===0&&<span style={{fontSize:12.5,color:C.sub,fontStyle:"italic"}}>Vacía</span>}{occ.map(g=>(<div key={g.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:13}}><span style={{width:5,height:5,borderRadius:99,background:C.sage}}/><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.nombre}</span><button onClick={()=>asgn(g.id,"")} style={{background:"none",border:"none",color:C.sub,cursor:"pointer"}}><X size={13}/></button></div>))}</div>
        </Card>);})}
      </div>
      <Btn kind="soft" onClick={add} style={{marginTop:12}}><Plus size={16}/> Añadir mesa</Btn>
    </>)}
  </div>);
}

// Iniciales para los asientos
function ini(n){const p=String(n||"").trim().split(/\s+/);return((p[0]?.[0]||"")+(p[1]?.[0]||"")).toUpperCase();}
// Geometría de mesa redonda/rectangular
function layout(forma,cap){
  const c=Math.max(1,num(cap));
  if(forma==="rect"){
    const top=Math.ceil(c/2),bot=c-top,sp=32,cols=Math.max(top,bot,1);
    const W=cols*sp+16,H=128,tableX=8,tableY=34,tableW=W-16,tableH=60;
    const seats=[];
    for(let i=0;i<top;i++){const x=(W-top*sp)/2+i*sp+sp/2;seats.push({x:x-13,y:4});}
    for(let i=0;i<bot;i++){const x=(W-bot*sp)/2+i*sp+sp/2;seats.push({x:x-13,y:H-30});}
    return{W,H,table:{x:tableX,y:tableY,w:tableW,h:tableH,r:16},seats};
  }
  const S=150+Math.max(0,c-8)*8,d=Math.round(S*0.5),rr=S/2-15;
  const seats=[];
  for(let i=0;i<c;i++){const a=(i/c)*2*Math.PI-Math.PI/2;seats.push({x:S/2+rr*Math.cos(a)-13,y:S/2+rr*Math.sin(a)-13});}
  return{W:S,H:S,table:{x:(S-d)/2,y:(S-d)/2,w:d,h:d,r:999},seats};
}

function Plano({data,up}){
  const [drag,setDrag]=useState(null);
  const [editing,setEditing]=useState(null);
  const [pick,setPick]=useState(null);
  const [info,setInfo]=useState(null);
  const [pq,setPq]=useState("");
  const dragRef=useRef(null);
  const sin=data.guests.filter(g=>!g.mesa);
  const addT=(forma)=>{const i=data.tables.length;up({tables:[...data.tables,{id:uid(),nombre:`Mesa ${i+1}`,capacidad:8,forma,x:20+(i%4)*180,y:20+Math.floor(i/4)*210}]});};
  const setT=(id,patch)=>up({tables:data.tables.map(t=>t.id===id?{...t,...patch}:t)});
  const delT=(id)=>{up({tables:data.tables.filter(t=>t.id!==id),guests:data.guests.map(g=>g.mesa===id?{...g,mesa:""}:g)});setEditing(null);};
  const asgn=(gid,tid)=>up({guests:data.guests.map(g=>g.id===gid?{...g,mesa:tid}:g)});
  const posOf=(t,i)=>({x:t.x!=null?t.x:20+(i%4)*180,y:t.y!=null?t.y:20+Math.floor(i/4)*210});
  const onDown=(e,t,px,py)=>{e.currentTarget.setPointerCapture(e.pointerId);dragRef.current={id:t.id,sx:e.clientX,sy:e.clientY,ox:px,oy:py,moved:false};setDrag({id:t.id,x:px,y:py});};
  const onMove=(e)=>{const d=dragRef.current;if(!d)return;const dx=e.clientX-d.sx,dy=e.clientY-d.sy;if(Math.abs(dx)+Math.abs(dy)>5)d.moved=true;setDrag({id:d.id,x:Math.max(0,d.ox+dx),y:Math.max(0,d.oy+dy)});};
  const onUp=(e,t)=>{const d=dragRef.current;if(!d){return;}if(d.moved){const nx=Math.max(0,d.ox+(e.clientX-d.sx)),ny=Math.max(0,d.oy+(e.clientY-d.sy));setT(t.id,{x:nx,y:ny});}else{setEditing(t);}dragRef.current=null;setDrag(null);};
  const pickList=sin.filter(g=>g.nombre.toLowerCase().includes(pq.toLowerCase()));
  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
      <Btn kind="soft" onClick={()=>addT("redonda")}><Circle size={16}/> Mesa redonda</Btn>
      <Btn kind="soft" onClick={()=>addT("rect")}><Square size={16}/> Mesa rectangular</Btn>
      <span style={{fontSize:12,color:C.sub,display:"flex",alignItems:"center",gap:4}}><Move size={13}/> arrastra para mover · toca un asiento para sentar</span>
    </div>
    {sin.length>0&&<div style={{fontSize:12.5,color:C.gold,fontWeight:600,marginBottom:8}}>{sin.length} invitados sin sentar</div>}
    <div style={{position:"relative",width:"100%",height:"68vh",overflow:"auto",background:"#FBFAF6",border:`1px solid ${C.line}`,borderRadius:16,backgroundImage:"radial-gradient(#E4DFD2 1px, transparent 1px)",backgroundSize:"22px 22px",WebkitOverflowScrolling:"touch"}}>
      <div style={{position:"relative",width:1400,height:1200}}>
        {data.tables.map((t,i)=>{
          const occ=data.guests.filter(g=>g.mesa===t.id);
          const cap=Math.max(num(t.capacidad),occ.length);
          const L=layout(t.forma,cap);
          const p=drag&&drag.id===t.id?{x:drag.x,y:drag.y}:posOf(t,i);
          const full=occ.length>num(t.capacidad);
          return(<div key={t.id} onPointerDown={e=>onDown(e,t,p.x,p.y)} onPointerMove={onMove} onPointerUp={e=>onUp(e,t)}
            style={{position:"absolute",left:p.x,top:p.y,width:L.W,height:L.H,touchAction:"none",cursor:"grab",userSelect:"none"}}>
            <div style={{position:"absolute",left:L.table.x,top:L.table.y,width:L.table.w,height:L.table.h,borderRadius:L.table.r,background:"#fff",border:`2px solid ${full?C.no:C.sage}`,boxShadow:"0 2px 6px rgba(0,0,0,.06)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
              <div style={{fontFamily:DISPLAY,fontWeight:700,fontSize:14,color:C.forest,textAlign:"center",lineHeight:1,padding:"0 4px",maxWidth:L.table.w-6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.nombre}</div>
              <div style={{fontSize:10,color:full?C.no:C.sub,fontWeight:600}}>{occ.length}/{num(t.capacidad)}</div>
            </div>
            {L.seats.map((s,si)=>{const g=occ[si];return(<div key={si} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();g?setInfo({t,g}):(setPq(""),setPick(t));}}
              title={g?g.nombre:"Asiento libre"}
              style={{position:"absolute",left:s.x,top:s.y,width:26,height:26,borderRadius:999,background:g?C.forest:"#fff",border:`2px solid ${g?C.forest:C.line}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,fontWeight:700,color:"#fff",zIndex:2}}>
              {g?ini(g.nombre):<Plus size={12} color={C.sub}/>}</div>);})}
          </div>);
        })}
        {data.tables.length===0&&<div style={{position:"absolute",left:0,right:0,top:120,textAlign:"center",color:C.sub,fontSize:14}}>Añade tu primera mesa con los botones de arriba.</div>}
      </div>
    </div>

    {/* Sentar invitado */}
    {pick&&<Modal title={`Sentar en ${pick.nombre}`} onClose={()=>setPick(null)}>
      {sin.length===0?<div style={{fontSize:14,color:C.sub,textAlign:"center",padding:"10px 0"}}>Todos los invitados ya están sentados. 🎉</div>:(<div>
        <div style={{position:"relative",marginBottom:10}}><Search size={16} color={C.sub} style={{position:"absolute",left:11,top:11}}/><input value={pq} onChange={e=>setPq(e.target.value)} placeholder="Buscar…" style={{...IS,paddingLeft:34}} autoFocus/></div>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"50vh",overflowY:"auto"}}>
          {pickList.map(g=>(<button key={g.id} onClick={()=>{asgn(g.id,pick.id);setPick(null);}} style={{textAlign:"left",border:`1px solid ${C.line}`,background:"#fff",borderRadius:10,padding:"10px 12px",cursor:"pointer",fontSize:14,fontWeight:600,color:C.ink,display:"flex",alignItems:"center",gap:8}}><span style={{width:26,height:26,borderRadius:999,background:C.sageSoft,color:C.forest,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{ini(g.nombre)}</span><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.nombre}</span>{g.tipo&&<span style={{fontSize:11,color:C.sub}}>{g.tipo}</span>}</button>))}
          {pickList.length===0&&<div style={{fontSize:13,color:C.sub,textAlign:"center",padding:"8px 0"}}>Nadie coincide con la búsqueda.</div>}
        </div>
      </div>)}
    </Modal>}

    {/* Info de asiento ocupado */}
    {info&&<Modal title={info.g.nombre} onClose={()=>setInfo(null)} footer={
      <div style={{display:"flex",gap:8}}><Btn kind="danger" onClick={()=>{asgn(info.g.id,"");setInfo(null);}} style={{flex:1,justifyContent:"center"}}><X size={16}/> Levantar de la mesa</Btn></div>}>
      <div style={{fontSize:14,color:C.sub}}>Sentado en <b style={{color:C.ink}}>{info.t.nombre}</b>{info.g.tipo?` · ${info.g.tipo}`:""}.</div>
    </Modal>}

    {/* Editar mesa */}
    {editing&&<Modal title="Mesa" onClose={()=>setEditing(null)} footer={
      <div style={{display:"flex",gap:8}}><Btn onClick={()=>setEditing(null)} style={{flex:1,justifyContent:"center"}}><Check size={16}/> Hecho</Btn><Btn kind="danger" onClick={()=>delT(editing.id)}><Trash2 size={16}/></Btn></div>}>
      {(()=>{const t=data.tables.find(x=>x.id===editing.id)||editing;return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label="Nombre de la mesa"><TI value={t.nombre} onChange={e=>setT(t.id,{nombre:e.target.value})} autoFocus/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Asientos"><TI type="number" value={t.capacidad} onChange={e=>setT(t.id,{capacidad:num(e.target.value)})}/></Field>
          <Field label="Forma"><Sel value={t.forma==="rect"?"rect":"redonda"} onChange={e=>setT(t.id,{forma:e.target.value})} options={[{v:"redonda",label:"Redonda"},{v:"rect",label:"Rectangular"}]}/></Field>
        </div>
        <div style={{fontSize:12.5,color:C.sub}}>Sentados: {data.guests.filter(g=>g.mesa===t.id).length} de {num(t.capacidad)}</div>
      </div>);})()}
    </Modal>}
  </div>);
}

// Tareas
function Tareas({data,up}){
  const [nueva,setNueva]=useState("");const [pl,setPl]=useState(PLAZOS[0]);
  const tog=(id)=>up({tasks:data.tasks.map(t=>t.id===id?{...t,hecho:!t.hecho}:t)});
  const del=(id)=>up({tasks:data.tasks.filter(t=>t.id!==id)});
  const add=()=>{if(!nueva.trim())return;up({tasks:[...data.tasks,{id:uid(),titulo:nueva.trim(),plazo:pl,hecho:false}]});setNueva("");};
  const hechas=data.tasks.filter(t=>t.hecho).length;const pct=data.tasks.length?Math.round(hechas/data.tasks.length*100):0;
  const ups=[...new Set([...PLAZOS,...data.tasks.map(t=>t.plazo)])];
  return(<div>
    <H sub={`${hechas} de ${data.tasks.length} completadas`}>Tareas</H>
    <Card style={{padding:16,marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}><Eyebrow>Progreso</Eyebrow><span style={{fontFamily:DISPLAY,fontSize:30,fontWeight:700,color:C.forest}}>{pct}%</span></div><div style={{height:10,background:C.line,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:C.sage,borderRadius:99,transition:"width .5s"}}/></div></Card>
    <Card style={{padding:12,marginBottom:16,display:"flex",gap:8,flexWrap:"wrap"}}><input value={nueva} onChange={e=>setNueva(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Nueva tarea…" style={{...IS,flex:1,minWidth:150}}/><Sel value={pl} onChange={e=>setPl(e.target.value)} options={PLAZOS} style={{width:150}}/><Btn onClick={add}><Plus size={16}/></Btn></Card>
    {ups.map(plazo=>{const items=data.tasks.filter(t=>t.plazo===plazo);if(!items.length)return null;const done=items.filter(t=>t.hecho).length;return(<div key={plazo} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontFamily:DISPLAY,fontSize:20,fontWeight:700}}>{plazo}</span><span style={{fontSize:12,color:C.sub,fontWeight:600}}>{done}/{items.length}</span></div><div style={{display:"flex",flexDirection:"column",gap:6}}>{items.map(t=>(<Card key={t.id} style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:11}}><button onClick={()=>tog(t.id)} style={{width:22,height:22,borderRadius:7,flexShrink:0,cursor:"pointer",border:`2px solid ${t.hecho?C.sage:C.line}`,background:t.hecho?C.sage:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.hecho&&<Check size={14} color="#fff" strokeWidth={3}/>}</button><span style={{flex:1,fontSize:14.5,color:t.hecho?C.sub:C.ink,textDecoration:t.hecho?"line-through":"none"}}>{t.titulo}</span><button onClick={()=>del(t.id)} style={{background:"none",border:"none",color:C.line,cursor:"pointer"}}><Trash2 size={15}/></button></Card>))}</div></div>);})}
  </div>);
}

// Proveedores
function Proveedores({data,up}){
  const [ed,setEd]=useState(null);
  const blank={id:"",categoria:CATS_PROV[0],nombre:"",telefono:"",email:"",coste:0,senal:0,estado:"Por contactar",notas:""};
  const save=(v)=>{if(!v.nombre.trim())return;if(v.id)up({vendors:data.vendors.map(x=>x.id===v.id?v:x)});else up({vendors:[...data.vendors,{...v,id:uid()}]});setEd(null);};
  const del=(id)=>up({vendors:data.vendors.filter(v=>v.id!==id)});
  const tc=data.vendors.reduce((s,v)=>s+num(v.coste),0);const ts=data.vendors.reduce((s,v)=>s+num(v.senal),0);
  return(<div>
    <H sub={`${data.vendors.length} proveedores · ${eur(tc)} total`} action={<Btn onClick={()=>setEd({...blank})}><Plus size={16}/> Añadir</Btn>}>Proveedores</H>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}><Stat label="Coste total" value={eur(tc)}/><Stat label="Señales pagadas" value={eur(ts)} accent={C.ok}/><Stat label="Pendiente" value={eur(tc-ts)} accent={C.no}/></div>
    {data.vendors.length===0?<Empty icon={Truck} title="Sin proveedores todavía" hint="Guarda aquí cada proveedor con su contacto, coste y estado." action={<Btn onClick={()=>setEd({...blank})}><Plus size={16}/> Añadir proveedor</Btn>}/>:(
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {data.vendors.map(v=>(<Card key={v.id} style={{padding:13}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,color:C.sage,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em"}}>{v.categoria}</div><div style={{fontWeight:600,fontSize:15.5,marginTop:2}}>{v.nombre}</div><div style={{display:"flex",gap:12,marginTop:6,flexWrap:"wrap",fontSize:12.5,color:C.sub}}>{v.telefono&&<a href={`tel:${v.telefono}`} style={{color:C.sub,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><Phone size={13}/>{v.telefono}</a>}{v.email&&<a href={`mailto:${v.email}`} style={{color:C.sub,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><Mail size={13}/>{v.email}</a>}</div>{v.notas&&<div style={{fontSize:12.5,color:C.sub,marginTop:6,fontStyle:"italic"}}>{v.notas}</div>}</div><button onClick={()=>setEd(v)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer"}}><Pencil size={16}/></button></div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.line}`}}><span style={{fontSize:12,fontWeight:700,color:"#fff",background:PROV_COLOR[v.estado]||C.sub,borderRadius:999,padding:"3px 10px"}}>{v.estado}</span><span style={{fontSize:13,color:C.sub,marginLeft:"auto"}}>Coste <b style={{color:C.ink}}>{eur(v.coste)}</b></span><span style={{fontSize:13,color:C.sub}}>Señal <b style={{color:C.ok}}>{eur(v.senal)}</b></span></div>
        </Card>))}
      </div>
    )}
    {ed&&<Modal title={ed.id?"Editar proveedor":"Nuevo proveedor"} onClose={()=>setEd(null)} footer={<div style={{display:"flex",gap:8}}><Btn onClick={()=>save(ed)} style={{flex:1,justifyContent:"center"}}><Check size={16}/> Guardar</Btn>{ed.id&&<Btn kind="danger" onClick={()=>{del(ed.id);setEd(null);}}><Trash2 size={16}/></Btn>}</div>}>
      {(()=>{const f=(k,v)=>setEd(s=>({...s,[k]:v}));return <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label="Nombre"><TI value={ed.nombre} onChange={e=>f("nombre",e.target.value)} autoFocus/></Field>
        <Field label="Categoría"><Sel value={ed.categoria} onChange={e=>f("categoria",e.target.value)} options={CATS_PROV}/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Teléfono"><TI value={ed.telefono} onChange={e=>f("telefono",e.target.value)} placeholder="600 000 000"/></Field><Field label="Email"><TI value={ed.email} onChange={e=>f("email",e.target.value)} placeholder="hola@…"/></Field></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Coste (€)"><TI type="number" value={ed.coste} onChange={e=>f("coste",num(e.target.value))}/></Field><Field label="Señal pagada (€)"><TI type="number" value={ed.senal} onChange={e=>f("senal",num(e.target.value))}/></Field></div>
        <Field label="Estado"><Sel value={ed.estado} onChange={e=>f("estado",e.target.value)} options={ESTADOS_PROV}/></Field>
        <Field label="Notas"><TI value={ed.notas} onChange={e=>f("notas",e.target.value)} placeholder="Qué incluye, condiciones…"/></Field>
      </div>;})()}
    </Modal>}
  </div>);
}

// Pagos
function Pagos({data,up}){
  const [ed,setEd]=useState(null);const blank={id:"",concepto:"",importe:0,fecha:"",pagado:false};
  const save=(p)=>{if(!p.concepto.trim())return;if(p.id)up({payments:data.payments.map(x=>x.id===p.id?p:x)});else up({payments:[...data.payments,{...p,id:uid()}]});setEd(null);};
  const del=(id)=>up({payments:data.payments.filter(p=>p.id!==id)});
  const tog=(id)=>up({payments:data.payments.map(p=>p.id===id?{...p,pagado:!p.pagado}:p)});
  const total=data.payments.reduce((s,p)=>s+num(p.importe),0);const pg=data.payments.filter(p=>p.pagado).reduce((s,p)=>s+num(p.importe),0);
  const orden=[...data.payments].sort((a,b)=>(a.pagado-b.pagado)||((a.fecha||"9").localeCompare(b.fecha||"9")));
  return(<div>
    <H sub="Controla señales y pagos con fechas de vencimiento." action={<Btn onClick={()=>setEd({...blank})}><Plus size={16}/> Añadir</Btn>}>Pagos</H>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}><Stat label="Total" value={eur(total)}/><Stat label="Pagado" value={eur(pg)} accent={C.ok}/><Stat label="Pendiente" value={eur(total-pg)} accent={C.no}/></div>
    {data.payments.length===0?<Empty icon={Receipt} title="Sin pagos registrados" hint="Apunta cada pago con su importe y fecha." action={<Btn onClick={()=>setEd({...blank})}><Plus size={16}/> Añadir pago</Btn>}/>:(
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{orden.map(p=>{const d=daysTo(p.fecha);const v=!p.pagado&&d!=null&&d<=14;return(<Card key={p.id} style={{padding:12,display:"flex",alignItems:"center",gap:11,opacity:p.pagado?.7:1}}>
        <button onClick={()=>tog(p.id)} style={{width:22,height:22,borderRadius:7,flexShrink:0,cursor:"pointer",border:`2px solid ${p.pagado?C.sage:C.line}`,background:p.pagado?C.sage:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{p.pagado&&<Check size={14} color="#fff" strokeWidth={3}/>}</button>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14.5,textDecoration:p.pagado?"line-through":"none"}}>{p.concepto}</div>{p.fecha&&<div style={{fontSize:12,color:v?C.no:C.sub,fontWeight:v?700:500,marginTop:2}}>{fmtDate(p.fecha)}{v&&d>=0?` · vence en ${d} días`:""}{d!=null&&d<0&&!p.pagado?" · vencido":""}</div>}</div>
        <span style={{fontWeight:700}}>{eur(p.importe)}</span>
        <button onClick={()=>setEd(p)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer"}}><Pencil size={15}/></button>
      </Card>);})}
    </div>)}
    {ed&&<Modal title={ed.id?"Editar pago":"Nuevo pago"} onClose={()=>setEd(null)} footer={<div style={{display:"flex",gap:8}}><Btn onClick={()=>save(ed)} style={{flex:1,justifyContent:"center"}}><Check size={16}/> Guardar</Btn>{ed.id&&<Btn kind="danger" onClick={()=>{del(ed.id);setEd(null);}}><Trash2 size={16}/></Btn>}</div>}>
      {(()=>{const f=(k,v)=>setEd(s=>({...s,[k]:v}));return <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label="Concepto"><TI value={ed.concepto} onChange={e=>f("concepto",e.target.value)} autoFocus/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Importe (€)"><TI type="number" value={ed.importe} onChange={e=>f("importe",num(e.target.value))}/></Field><Field label="Vence el"><TI type="date" value={ed.fecha} onChange={e=>f("fecha",e.target.value)}/></Field></div>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={ed.pagado} onChange={e=>f("pagado",e.target.checked)}/> Ya está pagado</label>
      </div>;})()}
    </Modal>}
  </div>);
}

// Cronograma
function Cronograma({data,up}){
  const set=(id,k,v)=>up({schedule:data.schedule.map(s=>s.id===id?{...s,[k]:v}:s)});
  const add=()=>up({schedule:[...data.schedule,{id:uid(),hora:"",momento:"",lugar:"",nota:""}]});
  const del=(id)=>up({schedule:data.schedule.filter(s=>s.id!==id)});
  const orden=[...data.schedule].sort((a,b)=>(a.hora||"z").localeCompare(b.hora||"z"));
  return(<div>
    <H sub="La minuta del día, hora a hora." action={<Btn onClick={add}><Plus size={16}/> Añadir</Btn>}>Cronograma</H>
    <div style={{display:"flex",flexDirection:"column",gap:0}}>{orden.map((s,i)=>(<div key={s.id} style={{display:"flex",gap:12}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:14}}><span style={{width:11,height:11,borderRadius:99,background:C.sage,border:`2px solid ${C.paper}`,flexShrink:0}}/>{i<orden.length-1&&<span style={{flex:1,width:2,background:C.line,marginTop:2}}/>}</div>
      <Card style={{padding:10,marginBottom:8,flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><input value={s.hora} onChange={e=>set(s.id,"hora",e.target.value)} placeholder="00:00" style={{...IS,width:64,fontFamily:DISPLAY,fontWeight:700,fontSize:16,padding:"6px 8px",color:C.forest}}/><input value={s.momento} onChange={e=>set(s.id,"momento",e.target.value)} placeholder="Momento" style={{...IS,flex:1,background:"transparent",border:"none",fontWeight:600,padding:"6px 0"}}/><button onClick={()=>del(s.id)} style={{background:"none",border:"none",color:C.line,cursor:"pointer"}}><Trash2 size={15}/></button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:6}}><input value={s.lugar} onChange={e=>set(s.id,"lugar",e.target.value)} placeholder="Lugar" style={{...IS,padding:"6px 8px",fontSize:12.5}}/><input value={s.nota} onChange={e=>set(s.id,"nota",e.target.value)} placeholder="Responsable / nota" style={{...IS,padding:"6px 8px",fontSize:12.5}}/></div></Card>
    </div>))}</div>
  </div>);
}

// Música
function Musica({data,up}){
  const [mom,setMom]=useState(MOMENTOS[0]);const [can,setCan]=useState("");const [art,setArt]=useState("");
  const add=()=>{if(!can.trim())return;up({music:[...data.music,{id:uid(),momento:mom,cancion:can.trim(),artista:art.trim()}]});setCan("");setArt("");};
  const del=(id)=>up({music:data.music.filter(m=>m.id!==id)});
  return(<div>
    <H sub="Vuestra banda sonora, por momentos.">Música</H>
    <Card style={{padding:12,marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><input value={can} onChange={e=>setCan(e.target.value)} placeholder="Canción" style={IS}/><input value={art} onChange={e=>setArt(e.target.value)} placeholder="Artista" style={IS}/></div><div style={{display:"flex",gap:8}}><Sel value={mom} onChange={e=>setMom(e.target.value)} options={MOMENTOS} style={{flex:1}}/><Btn onClick={add}><Plus size={16}/> Añadir</Btn></div></Card>
    {MOMENTOS.map(m=>{const items=data.music.filter(x=>x.momento===m);return(<div key={m} style={{marginBottom:16}}><div style={{fontFamily:DISPLAY,fontSize:20,fontWeight:700,color:m==="No quiero que suene"?C.no:C.ink,marginBottom:8}}>{m}</div>{items.length===0?<div style={{fontSize:13,color:C.sub,fontStyle:"italic"}}>Sin canciones todavía.</div>:<div style={{display:"flex",flexDirection:"column",gap:6}}>{items.map(x=>(<Card key={x.id} style={{padding:"9px 12px",display:"flex",alignItems:"center",gap:10}}><Music size={15} color={C.sage}/><div style={{flex:1,minWidth:0}}><span style={{fontWeight:600,fontSize:14}}>{x.cancion}</span>{x.artista&&<span style={{color:C.sub,fontSize:13}}> · {x.artista}</span>}</div><button onClick={()=>del(x.id)} style={{background:"none",border:"none",color:C.line,cursor:"pointer"}}><Trash2 size={15}/></button></Card>))}</div>}</div>);})}
  </div>);
}

// Regalos
function Regalos({data,up}){
  const [ed,setEd]=useState(null);const blank={id:"",de:"",detalle:"",importe:0,agradecido:false};
  const save=(g)=>{if(!g.de.trim())return;if(g.id)up({gifts:data.gifts.map(x=>x.id===g.id?g:x)});else up({gifts:[...data.gifts,{...g,id:uid()}]});setEd(null);};
  const del=(id)=>up({gifts:data.gifts.filter(g=>g.id!==id)});
  const tog=(id)=>up({gifts:data.gifts.map(g=>g.id===id?{...g,agradecido:!g.agradecido}:g)});
  const total=data.gifts.reduce((s,g)=>s+num(g.importe),0);const agr=data.gifts.filter(g=>g.agradecido).length;
  return(<div>
    <H sub={`${data.gifts.length} regalos · ${eur(total)} · ${agr} agradecidos`} action={<Btn onClick={()=>setEd({...blank})}><Plus size={16}/> Añadir</Btn>}>Regalos y sobres</H>
    {data.gifts.length===0?<Empty icon={Gift} title="Aún no hay regalos" hint="Apunta quién os regala qué y marca cuando le hayáis dado las gracias." action={<Btn onClick={()=>setEd({...blank})}><Plus size={16}/> Añadir regalo</Btn>}/>:(
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{data.gifts.map(g=>(<Card key={g.id} style={{padding:12,display:"flex",alignItems:"center",gap:11}}>
        <button onClick={()=>tog(g.id)} style={{width:22,height:22,borderRadius:7,flexShrink:0,cursor:"pointer",border:`2px solid ${g.agradecido?C.sage:C.line}`,background:g.agradecido?C.sage:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{g.agradecido&&<Check size={14} color="#fff" strokeWidth={3}/>}</button>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14.5}}>{g.de}</div>{g.detalle&&<div style={{fontSize:12.5,color:C.sub,marginTop:2}}>{g.detalle}</div>}</div>
        {num(g.importe)>0&&<span style={{fontWeight:700,color:C.ok}}>{eur(g.importe)}</span>}
        <button onClick={()=>setEd(g)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer"}}><Pencil size={15}/></button>
      </Card>))}</div>
    )}
    {ed&&<Modal title={ed.id?"Editar regalo":"Nuevo regalo"} onClose={()=>setEd(null)} footer={<div style={{display:"flex",gap:8}}><Btn onClick={()=>save(ed)} style={{flex:1,justifyContent:"center"}}><Check size={16}/> Guardar</Btn>{ed.id&&<Btn kind="danger" onClick={()=>{del(ed.id);setEd(null);}}><Trash2 size={16}/></Btn>}</div>}>
      {(()=>{const f=(k,v)=>setEd(s=>({...s,[k]:v}));return <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label="De parte de"><TI value={ed.de} onChange={e=>f("de",e.target.value)} placeholder="Ej.: Tíos Ana y Pedro" autoFocus/></Field>
        <Field label="Detalle (opcional)"><TI value={ed.detalle} onChange={e=>f("detalle",e.target.value)} placeholder="Sobre, vajilla, experiencia…"/></Field>
        <Field label="Importe (€, si es sobre)"><TI type="number" value={ed.importe} onChange={e=>f("importe",num(e.target.value))}/></Field>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={ed.agradecido} onChange={e=>f("agradecido",e.target.checked)}/> Ya le hemos dado las gracias</label>
      </div>;})()}
    </Modal>}
  </div>);
}

// Ajustes
function Ajustes({data,up,setData,codigo,bodaId,signOut}){
  const [cr,setCr]=useState(false);const [copied,setCopied]=useState(false);
  const copy=()=>navigator.clipboard.writeText(codigo).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});
  const reset=async()=>{setData(SEED);if(bodaId)await supabase.from("bodas").update({data:SEED}).eq("id",bodaId);setCr(false);};
  const exportar=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="boda.json";a.click();URL.revokeObjectURL(u);};
  return(<div>
    <H sub="Ajusta vuestros datos y comparte el acceso con tu pareja.">Ajustes</H>
    <Card style={{padding:18,marginBottom:14,border:`2px solid ${C.sageSoft}`}}>
      <Eyebrow>Código de boda</Eyebrow>
      <div style={{marginTop:10,display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontFamily:DISPLAY,fontSize:48,fontWeight:700,color:C.forest,letterSpacing:".15em",lineHeight:1}}>{codigo}</div>
        <button onClick={copy} style={{background:copied?C.okBg:C.sageSoft,border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",color:copied?C.ok:C.forest,fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6}}>{copied?<><Check size={15}/> Copiado</>:<><Copy size={15}/> Copiar</>}</button>
      </div>
      <div style={{marginTop:12,padding:"12px 14px",background:C.sageSoft,borderRadius:12}}>
        <div style={{fontWeight:700,fontSize:13.5,color:C.ink,marginBottom:6,display:"flex",alignItems:"center",gap:6}}><Link2 size={15} color={C.sage}/> Cómo se une tu pareja</div>
        <div style={{fontSize:13,color:C.sub,lineHeight:1.6}}>1. Tu pareja abre la app e inicia sesión (o crea su cuenta).<br/>2. Elige <b>"Unirme a una boda"</b>.<br/>3. Escribe el código <b style={{color:C.forest,letterSpacing:".1em"}}>{codigo}</b> y ya estáis sincronizados. ☁️</div>
      </div>
    </Card>
    <Card style={{padding:18,marginBottom:14}}>
      <Eyebrow>Vuestra boda</Eyebrow>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:12}}>
        <Field label="Nombres de la pareja"><TI value={data.settings.couple} onChange={e=>up({settings:{...data.settings,couple:e.target.value}})} placeholder="Ana & Carlos"/></Field>
        <Field label="Fecha de la boda"><TI type="date" value={data.settings.date} onChange={e=>up({settings:{...data.settings,date:e.target.value}})}/></Field>
      </div>
    </Card>
    <Card style={{padding:18,marginBottom:14}}>
      <Eyebrow>Copia de seguridad</Eyebrow>
      <p style={{fontSize:13.5,color:C.sub,margin:"8px 0 14px"}}>Los datos se guardan en la nube automáticamente. Aquí puedes descargar una copia local extra.</p>
      <Btn kind="soft" onClick={exportar}><Download size={16}/> Descargar copia JSON</Btn>
    </Card>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      <Btn kind="ghost" onClick={signOut}><LogOut size={16}/> Cerrar sesión</Btn>
    </div>
    {cr?(<Card style={{padding:14,border:`1px solid ${C.no}55`}}><div style={{fontSize:13.5,marginBottom:10}}>¿Seguro? Se borrará todo el contenido de vuestra boda.</div><div style={{display:"flex",gap:8}}><Btn kind="danger" onClick={reset}><Trash2 size={16}/> Sí, borrar todo</Btn><Btn kind="ghost" onClick={()=>setCr(false)}>Cancelar</Btn></div></Card>):<Btn kind="danger" onClick={()=>setCr(true)}><Trash2 size={16}/> Borrar todos los datos</Btn>}
    <p style={{fontSize:12,color:C.sub,marginTop:24,textAlign:"center"}}>Bódate · Hecho con cariño para vuestro gran día 🌿</p>
  </div>);
}
