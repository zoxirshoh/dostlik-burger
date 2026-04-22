import { useState,} from "react";

// ─── HELPERS ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).substr(2, 9);
const fmt = (n) => Math.round(n || 0).toLocaleString("uz-UZ");
const today = () => new Date().toISOString().split("T")[0];
const nowTs = () => new Date().toISOString();
const months = ["Yan","Fev","Mar","Apr","May","Iyun","Iyul","Avg","Sen","Okt","Noy","Dek"];
const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};
const fmtDay = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

const CATEGORIES = [
  { id:"burger",   label:"Burger",   emoji:"🍔" },
  { id:"lavash",   label:"Lavash",   emoji:"🌯" },
  { id:"hotdog",   label:"Hot Dog",  emoji:"🌭" },
  { id:"donar",    label:"Do'nar",   emoji:"🥙" },
  { id:"ichimlik", label:"Ichimlik", emoji:"🥤" },
];

const INIT = {
  products: [],
  sales: [],
  purchases: [],
};

function loadData() {
  try { return JSON.parse(localStorage.getItem("db_v2")) || INIT; }
  catch { return INIT; }
}
function saveData(d) { localStorage.setItem("db_v2", JSON.stringify(d)); }

const VIEWS = ["dashboard","products","sales","purchases","history"];
const VIEW_LABELS = {
  dashboard:"📊 Dashboard",
  products:"🍔 Mahsulotlar",
  sales:"💸 Sotuv",
  purchases:"📦 Xarid",
  history:"📋 Tarix"
};

export default function App() {
  const [db, setDb] = useState(loadData);
  const [view, setView] = useState("dashboard");

  const update = (fn) => {
    setDb(prev => {
      const next = fn(prev);
      saveData(next);
      return next;
    });
  };

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",minHeight:"100vh",background:"#0c0b09",color:"#f0ead8"}}>
      <AppStyle/>
      <AppHeader view={view}/>
      <BottomNav view={view} setView={setView}/>
      <div className="page">
        {view==="dashboard"  && <Dashboard  db={db}/>}
        {view==="products"   && <Products   db={db} update={update}/>}
        {view==="sales"      && <SalesView  db={db} update={update}/>}
        {view==="purchases"  && <Purchases  db={db} update={update}/>}
        {view==="history"    && <HistoryView db={db} update={update}/>}
      </div>
    </div>
  );
}

function AppHeader({view}) {
  return (
    <header className="app-header">
      <div className="hd-brand">
        <span className="hd-logo">🍔</span>
        <div>
          <div className="hd-name">Do'stlik <span>Burger</span></div>
          <div className="hd-sub">Biznes Boshqaruv Tizimi</div>
        </div>
      </div>
      <div className="hd-view">{VIEW_LABELS[view]}</div>
    </header>
  );
}

function BottomNav({view,setView}) {
  const icons = {dashboard:"📊",products:"🍔",sales:"💸",purchases:"📦",history:"📋"};
  const labels = {dashboard:"Bosh",products:"Mahsulot",sales:"Sotuv",purchases:"Xarid",history:"Tarix"};
  return (
    <nav className="bottom-nav">
      {VIEWS.map(v=>(
        <button key={v} className={`nav-btn${view===v?" active":""}`} onClick={()=>setView(v)}>
          <span className="nav-ico">{icons[v]}</span>
          <span className="nav-lbl">{labels[v]}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({db}) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const thisDay = today();

  const monthlySales = db.sales.filter(s=>s.date.startsWith(thisMonth));
  const todaySales   = db.sales.filter(s=>s.date.startsWith(thisDay));
  const monthlyPurch = db.purchases.filter(p=>p.date.startsWith(thisMonth));

  const mRevenue = monthlySales.reduce((a,s)=>a+s.sellPrice*s.qty,0);
  const mCost    = monthlySales.reduce((a,s)=>a+s.costPrice*s.qty,0);
  const mProfit  = mRevenue - mCost;
  const mSpend   = monthlyPurch.reduce((a,p)=>a+p.amount,0);
  const netProfit= mProfit - mSpend;

  const tRevenue = todaySales.reduce((a,s)=>a+s.sellPrice*s.qty,0);
  const tProfit  = todaySales.reduce((a,s)=>a+(s.sellPrice-s.costPrice)*s.qty,0);
  const tQty     = todaySales.reduce((a,s)=>a+s.qty,0);

  const prodMap = {};
  monthlySales.forEach(s=>{
    if(!prodMap[s.productId]) prodMap[s.productId]={name:s.productName,qty:0,revenue:0,profit:0};
    prodMap[s.productId].qty+=s.qty;
    prodMap[s.productId].revenue+=s.sellPrice*s.qty;
    prodMap[s.productId].profit+=(s.sellPrice-s.costPrice)*s.qty;
  });
  const topProds = Object.values(prodMap).sort((a,b)=>b.profit-a.profit).slice(0,5);

  const days7 = [];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const dStr=d.toISOString().split("T")[0];
    const ds=db.sales.filter(s=>s.date.startsWith(dStr));
    days7.push({
      label:fmtDay(dStr+"T00:00:00"),
      revenue:ds.reduce((a,s)=>a+s.sellPrice*s.qty,0),
      profit:ds.reduce((a,s)=>a+(s.sellPrice-s.costPrice)*s.qty,0),
    });
  }
  const maxRev = Math.max(...days7.map(d=>d.revenue),1);

  return (
    <div className="dash">
      <div className="section-label">⚡ Bugun</div>
      <div className="stats-row">
        <div className="stat-card stat-yellow"><div className="stat-label">Bugungi kirim</div><div className="stat-value">{fmt(tRevenue)} <span className="stat-unit">so'm</span></div></div>
        <div className={`stat-card stat-${tProfit>=0?"green":"red"}`}><div className="stat-label">Bugungi foyda</div><div className="stat-value">{tProfit>=0?"+":""}{fmt(tProfit)} <span className="stat-unit">so'm</span></div></div>
        <div className="stat-card stat-orange"><div className="stat-label">Sotildi</div><div className="stat-value">{tQty} <span className="stat-unit">ta</span></div></div>
      </div>

      <div className="section-label">📅 Bu oy — {months[now.getMonth()]}</div>
      <div className="stats-row four">
        <div className="stat-card stat-yellow"><div className="stat-label">Umumiy kirim</div><div className="stat-value">{fmt(mRevenue)} <span className="stat-unit">so'm</span></div></div>
        <div className="stat-card stat-orange"><div className="stat-label">Mahsulot xarajat</div><div className="stat-value">{fmt(mCost)} <span className="stat-unit">so'm</span></div></div>
        <div className="stat-card stat-red"><div className="stat-label">Qo'shimcha xarajat</div><div className="stat-value">{fmt(mSpend)} <span className="stat-unit">so'm</span></div></div>
        <div className={`stat-card stat-${netProfit>=0?"green":"red"} stat-big`}><div className="stat-label">⭐ Sof foyda (oylik)</div><div className="stat-value" style={{fontSize:28}}>{netProfit>=0?"+":""}{fmt(netProfit)} <span className="stat-unit">so'm</span></div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">📈 Oxirgi 7 kun</span></div>
        <div className="card-body">
          <div className="bar-chart">
            {days7.map((d,i)=>(
              <div key={i} className="bar-col">
                <div className="bar-wrap">
                  <div className="bar-fill" style={{height:`${(d.revenue/maxRev)*100}%`}}/>
                  <div className="bar-profit" style={{height:`${Math.max(0,(d.profit/maxRev)*100)}%`}}/>
                </div>
                <div className="bar-label">{d.label}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="leg-item"><span className="leg-dot orange"/>Kirim</span>
            <span className="leg-item"><span className="leg-dot green"/>Foyda</span>
          </div>
        </div>
      </div>

      {topProds.length>0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">🏆 Top mahsulotlar (bu oy)</span></div>
          <div className="card-body" style={{padding:0}}>
            {topProds.map((p,i)=>(
              <div key={i} className="top-row">
                <div className="top-rank">#{i+1}</div>
                <div className="top-name">{p.name}</div>
                <div className="top-info">
                  <span className="badge-qty">{p.qty} ta</span>
                  <span className="top-profit">+{fmt(p.profit)} so'm</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {db.products.length===0 && (
        <div className="empty-big">
          <div style={{fontSize:48}}>🍔</div>
          <div style={{marginTop:8,fontWeight:700,color:"#7a7060"}}>Avval mahsulot qo'shing</div>
          <div style={{fontSize:12,color:"#504840",marginTop:4}}>Mahsulotlar bo'limiga o'ting</div>
        </div>
      )}
    </div>
  );
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
function Products({db,update}) {
  const [modal, setModal] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [form, setForm] = useState({categoryId:"burger",name:"",sellPrice:"",ingredients:[]});
  const [newIng, setNewIng] = useState({name:"",price:""});

  const filtered = db.products.filter(p=> catFilter==="all" || p.categoryId===catFilter);
  const costOf = (p) => p.ingredients.reduce((a,i)=>a+(parseFloat(i.price)||0),0);

  const openAdd = () => {
    setForm({categoryId:"burger",name:"",sellPrice:"",ingredients:[]});
    setNewIng({name:"",price:""});
    setModal(true);
  };

  const addIng = () => {
    if(!newIng.name.trim()||!newIng.price) return;
    setForm(f=>({...f,ingredients:[...f.ingredients,{id:uid(),name:newIng.name.trim(),price:parseFloat(newIng.price)}]}));
    setNewIng({name:"",price:""});
  };

  const removeIng = (id) => setForm(f=>({...f,ingredients:f.ingredients.filter(i=>i.id!==id)}));

  const saveProduct = () => {
    if(!form.name.trim()||!form.sellPrice) return;
    const cat = CATEGORIES.find(c=>c.id===form.categoryId);
    update(d=>({...d,products:[...d.products,{
      id:uid(), categoryId:form.categoryId,
      name:`${cat.emoji} ${form.name}`,
      sellPrice:parseFloat(form.sellPrice),
      ingredients:form.ingredients,
      createdAt:nowTs(),
    }]}));
    setModal(false);
  };

  const deleteProduct = (id) => update(d=>({...d,products:d.products.filter(p=>p.id!==id)}));

  const formCost = form.ingredients.reduce((a,i)=>a+(parseFloat(i.price)||0),0);
  const formProfit = (parseFloat(form.sellPrice)||0) - formCost;

  return (
    <div>
      <div className="filter-row">
        <button className={`filter-btn${catFilter==="all"?" active":""}`} onClick={()=>setCatFilter("all")}>Barchasi</button>
        {CATEGORIES.map(c=>(
          <button key={c.id} className={`filter-btn${catFilter===c.id?" active":""}`} onClick={()=>setCatFilter(c.id)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <span className="section-label" style={{margin:0}}>{filtered.length} ta mahsulot</span>
        <button className="btn-primary" onClick={openAdd}>+ Yangi mahsulot</button>
      </div>

      <div className="prod-list">
        {filtered.length===0 && (
          <div className="empty-big">
            <div style={{fontSize:40}}>📦</div>
            <div style={{color:"#7a7060",marginTop:8,fontWeight:700}}>Mahsulot yo'q</div>
          </div>
        )}
        {filtered.map(p=>{
          const cost = costOf(p);
          const profit = p.sellPrice - cost;
          const margin = p.sellPrice>0?((profit/p.sellPrice)*100).toFixed(0):0;
          return (
            <div key={p.id} className="prod-card">
              <div className="prod-top">
                <div>
                  <div className="prod-name">{p.name}</div>
                  <div className="prod-cat">{CATEGORIES.find(c=>c.id===p.categoryId)?.label} · {fmtDay(p.createdAt)}</div>
                </div>
                <button className="del-btn" onClick={()=>deleteProduct(p.id)}>🗑</button>
              </div>
              <div className="prod-stats">
                <div className="ps-item"><span className="ps-label">Tannarx</span><span className="ps-val orange">{fmt(cost)} so'm</span></div>
                <div className="ps-item"><span className="ps-label">Sotish narxi</span><span className="ps-val yellow">{fmt(p.sellPrice)} so'm</span></div>
                <div className="ps-item"><span className="ps-label">Foyda</span><span className={`ps-val ${profit>=0?"green":"red"}`}>+{fmt(profit)} ({margin}%)</span></div>
              </div>
              {p.ingredients.length>0 && (
                <div className="ing-chips">
                  {p.ingredients.map(i=>(
                    <span key={i.id} className="ing-chip">{i.name}: {fmt(i.price)}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Yangi mahsulot qo'shish</span>
              <button className="del-btn" style={{fontSize:18}} onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-form">
                <label className="form-label">Kategoriya</label>
                <div className="cat-select">
                  {CATEGORIES.map(c=>(
                    <button key={c.id} className={`cat-btn${form.categoryId===c.id?" active":""}`}
                      onClick={()=>setForm(f=>({...f,categoryId:c.id}))}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
                <label className="form-label">Mahsulot nomi</label>
                <input className="inp" placeholder="Masalan: 10,000 so'mlik Hot Dog"
                  value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                <label className="form-label">Sotish narxi (so'm)</label>
                <input className="inp inp-yellow" type="number" placeholder="0"
                  value={form.sellPrice} onChange={e=>setForm(f=>({...f,sellPrice:e.target.value}))}/>
                <label className="form-label" style={{marginTop:8}}>Ingredientlar (xarajatlar)</label>
                <div className="ing-form">
                  <input className="inp" placeholder="Nom" value={newIng.name}
                    onChange={e=>setNewIng(p=>({...p,name:e.target.value}))}
                    onKeyDown={e=>e.key==="Enter"&&addIng()}/>
                  <input className="inp" type="number" placeholder="Narx" style={{maxWidth:110}} value={newIng.price}
                    onChange={e=>setNewIng(p=>({...p,price:e.target.value}))}
                    onKeyDown={e=>e.key==="Enter"&&addIng()}/>
                  <button className="btn-orange" onClick={addIng}>+</button>
                </div>
                {form.ingredients.map(i=>(
                  <div key={i.id} className="ing-row">
                    <span className="ing-dot"/>
                    <span style={{flex:1,fontWeight:700,fontSize:13}}>{i.name}</span>
                    <span style={{color:"#FFB800",fontWeight:800,fontSize:13}}>{fmt(i.price)} so'm</span>
                    <button className="del-btn" onClick={()=>removeIng(i.id)}>✕</button>
                  </div>
                ))}
                {form.ingredients.length>0 && (
                  <div className="cost-preview">
                    Tannarx: <strong style={{color:"#FF6B1A"}}>{fmt(formCost)} so'm</strong>
                    {form.sellPrice && <>
                      {" "}· Foyda: <strong style={{color: formProfit>=0?"#4CD964":"#E8291C"}}>
                        {formProfit>=0?"+":""}{fmt(formProfit)} so'm
                      </strong>
                    </>}
                  </div>
                )}
                <button className="btn-primary" style={{width:"100%",marginTop:14}} onClick={saveProduct}>✓ Saqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SALES ───────────────────────────────────────────────────────────────────
function SalesView({db,update}) {
  const [selProd, setSelProd] = useState("");
  const [qty, setQty] = useState(1);
  const [success, setSuccess] = useState(false);

  const prod = db.products.find(p=>p.id===selProd);
  const cost = prod ? prod.ingredients.reduce((a,i)=>a+(parseFloat(i.price)||0),0) : 0;

  const recordSale = () => {
    if(!prod||qty<1) return;
    update(d=>({...d,sales:[{
      id:uid(), productId:prod.id, productName:prod.name,
      qty:parseInt(qty), sellPrice:prod.sellPrice, costPrice:cost,
      profit:(prod.sellPrice-cost)*qty, date:nowTs(),
    },...d.sales]}));
    setSuccess(true);
    setTimeout(()=>setSuccess(false),1500);
    setQty(1);
  };

  const todaySales = db.sales.filter(s=>s.date.startsWith(today()));

  const tProfit  = todaySales.reduce((a,s)=>a+(s.sellPrice-s.costPrice)*s.qty,0);

  return (
    <div>
      <div className="card">
        <div className="card-header"><span className="card-title">💸 Sotuv Kiritish</span></div>
        <div className="card-body">
          {db.products.length===0
            ? <div className="empty-big" style={{padding:"20px 0"}}><div style={{color:"#7a7060",fontWeight:700}}>Avval mahsulot qo'shing</div></div>
            : <>
              <label className="form-label">Mahsulot tanlang</label>
              <select className="inp inp-select" value={selProd} onChange={e=>setSelProd(e.target.value)}>
                <option value="">— Mahsulot tanlang —</option>
                {CATEGORIES.map(cat=>{
                  const prods=db.products.filter(p=>p.categoryId===cat.id);
                  if(!prods.length) return null;
                  return (
                    <optgroup key={cat.id} label={`${cat.emoji} ${cat.label}`}>
                      {prods.map(p=><option key={p.id} value={p.id}>{p.name} — {fmt(p.sellPrice)} so'm</option>)}
                    </optgroup>
                  );
                })}
              </select>
              {prod && (
                <div className="sale-preview">
                  <div className="sp-row"><span>Tannarx:</span><span style={{color:"#FF6B1A"}}>{fmt(cost)} so'm</span></div>
                  <div className="sp-row"><span>Sotish narxi:</span><span style={{color:"#FFB800"}}>{fmt(prod.sellPrice)} so'm</span></div>
                  <div className="sp-row"><span>1 ta foyda:</span><span style={{color:"#4CD964"}}>+{fmt(prod.sellPrice-cost)} so'm</span></div>
                </div>
              )}
              <label className="form-label" style={{marginTop:12}}>Soni (nechta sotildi)</label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button className="qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                <input className="inp" style={{textAlign:"center",maxWidth:80,fontSize:20,fontWeight:900}} type="number" min="1"
                  value={qty} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))}/>
                <button className="qty-btn" onClick={()=>setQty(q=>q+1)}>+</button>
              </div>
              {prod && qty>0 && (
                <div className="total-box">
                  <div><span className="form-label">Jami kirim:</span><span style={{color:"#FFB800",fontWeight:900,fontSize:18,marginLeft:8}}>{fmt(prod.sellPrice*qty)} so'm</span></div>
                  <div><span className="form-label">Jami foyda:</span><span style={{color:"#4CD964",fontWeight:900,fontSize:18,marginLeft:8}}>+{fmt((prod.sellPrice-cost)*qty)} so'm</span></div>
                </div>
              )}
              <button
                className={`btn-primary${success?" btn-success":""}`}
                style={{width:"100%",marginTop:14}}
                onClick={recordSale}
              >
                {success ? "✓ Kiritildi!" : "💸 Sotuvni Saqlash"}
              </button>
            </>
          }
        </div>
      </div>

      {todaySales.length>0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Bugungi sotuvlar</span>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{color:"#4CD964",fontWeight:900,fontSize:13}}>+{fmt(tProfit)}</span>
              <span className="badge-count">{todaySales.length} ta</span>
            </div>
          </div>
          <div className="card-body" style={{padding:0}}>
            {todaySales.map(s=>(
              <div key={s.id} className="hist-row">
                <div className="hist-main">
                  <span className="hist-name">{s.productName}</span>
                  <span style={{fontSize:11,color:"#504840"}}>{fmtDate(s.date)}</span>
                </div>
                <div className="hist-right">
                  <div style={{textAlign:"right"}}>
                    <div style={{color:"#FFB800",fontWeight:900,fontSize:14}}>{fmt(s.sellPrice*s.qty)} so'm</div>
                    <div style={{fontSize:11,color:"#4CD964"}}>×{s.qty} · +{fmt((s.sellPrice-s.costPrice)*s.qty)} foyda</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PURCHASES ───────────────────────────────────────────────────────────────
function Purchases({db,update}) {
  const [note,setNote]=useState("");
  const [amount,setAmount]=useState("");
  const [success,setSuccess]=useState(false);

  const save = () => {
    if(!amount) return;
    update(d=>({...d,purchases:[{id:uid(),note:note||"Xarid",amount:parseFloat(amount),date:nowTs()},...d.purchases]}));
    setNote(""); setAmount("");
    setSuccess(true); setTimeout(()=>setSuccess(false),1500);
  };

  const del = (id) => update(d=>({...d,purchases:d.purchases.filter(p=>p.id!==id)}));

  const now=new Date();
  const thisMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthly=db.purchases.filter(p=>p.date.startsWith(thisMonth));
  const mTotal=monthly.reduce((a,p)=>a+p.amount,0);

  return (
    <div>
      <div className="card">
        <div className="card-header"><span className="card-title">📦 Xarid / Chiqim Kiritish</span></div>
        <div className="card-body">
          <label className="form-label">Nima xarid qilindi / xarajat</label>
          <input className="inp" placeholder="Masalan: Non xaridi, Go'sht, Gaz puli..."
            value={note} onChange={e=>setNote(e.target.value)}/>
          <label className="form-label" style={{marginTop:12}}>Qancha pul ketdi (so'm)</label>
          <input className="inp inp-red" type="number" placeholder="0" value={amount}
            onChange={e=>setAmount(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&save()}/>
          <button className={`btn-red${success?" btn-success":""}`} style={{width:"100%",marginTop:14}} onClick={save}>
            {success ? "✓ Kiritildi!" : "📦 Xaridni Saqlash"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Bu oy xarajatlar</span>
          <span style={{color:"#E8291C",fontWeight:900,fontSize:15}}>−{fmt(mTotal)} so'm</span>
        </div>
        <div className="card-body" style={{padding:0}}>
          {monthly.length===0
            ? <div style={{padding:"20px",textAlign:"center",color:"#7a7060",fontWeight:700}}>Xarid yo'q</div>
            : monthly.map(p=>(
              <div key={p.id} className="hist-row">
                <div className="hist-main">
                  <span className="hist-name">{p.note}</span>
                  <span style={{fontSize:11,color:"#504840"}}>{fmtDate(p.date)}</span>
                </div>
                <div className="hist-right">
                  <span style={{color:"#E8291C",fontWeight:900}}>−{fmt(p.amount)} so'm</span>
                  <button className="del-btn" onClick={()=>del(p.id)}>🗑</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
function HistoryView({db,update}) {
  const [timeF,setTimeF]=useState("month");
  const [catF,setCatF]=useState("all");
  const [tab,setTab]=useState("sales");

  const now=new Date();
  const cutoffs = {
    all: null,
    today: today(),
    week: new Date(now.getTime()-6*86400000).toISOString().split("T")[0],
    month: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`,
  };

  const filterByTime = (item) => {
    const cutoff = cutoffs[timeF];
    if(!cutoff) return true;
    if(timeF==="week") return item.date.split("T")[0] >= cutoff;
    return item.date.startsWith(cutoff);
  };

  const salesFiltered = db.sales.filter(s => {
    if(!filterByTime(s)) return false;
    if(catF==="all") return true;
    const p = db.products.find(x=>x.id===s.productId);
    return p?.categoryId===catF;
  });

  const purchFiltered = db.purchases.filter(filterByTime);

  const list = tab==="sales" ? salesFiltered : purchFiltered;
  const totalRev    = tab==="sales" ? salesFiltered.reduce((a,s)=>a+s.sellPrice*s.qty,0) : purchFiltered.reduce((a,p)=>a+p.amount,0);
  const totalProfit = salesFiltered.reduce((a,s)=>a+(s.sellPrice-s.costPrice)*s.qty,0);
  const totalQty    = salesFiltered.reduce((a,s)=>a+s.qty,0);

  const delSale  = id => update(d=>({...d,sales:d.sales.filter(s=>s.id!==id)}));
  const delPurch = id => update(d=>({...d,purchases:d.purchases.filter(p=>p.id!==id)}));

  return (
    <div>
      <div className="tab-toggle">
        <button className={`tt-btn${tab==="sales"?" active":""}`} onClick={()=>setTab("sales")}>💸 Sotuv tarixi</button>
        <button className={`tt-btn${tab==="purchases"?" active":""}`} onClick={()=>setTab("purchases")}>📦 Xarid tarixi</button>
      </div>

      <div className="filter-row" style={{marginTop:8}}>
        {[["all","Barchasi"],["today","Bugun"],["week","7 kun"],["month","Bu oy"]].map(([k,l])=>(
          <button key={k} className={`filter-btn${timeF===k?" active":""}`} onClick={()=>setTimeF(k)}>{l}</button>
        ))}
      </div>

      {tab==="sales" && (
        <div className="filter-row">
          <button className={`filter-btn${catF==="all"?" active":""}`} onClick={()=>setCatF("all")}>Barchasi</button>
          {CATEGORIES.map(c=>(
            <button key={c.id} className={`filter-btn${catF===c.id?" active":""}`} onClick={()=>setCatF(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="summary-bar">
        {tab==="sales" ? <>
          <div className="sb-item"><span>Jami kirim</span><span style={{color:"#FFB800"}}>{fmt(totalRev)} so'm</span></div>
          <div className="sb-item"><span>Jami foyda</span><span style={{color:"#4CD964"}}>+{fmt(totalProfit)} so'm</span></div>
          <div className="sb-item"><span>Sotuv soni</span><span style={{color:"#FF6B1A"}}>{totalQty} ta</span></div>
        </> : <>
          <div className="sb-item"><span>Jami xarajat</span><span style={{color:"#E8291C"}}>−{fmt(totalRev)} so'm</span></div>
          <div className="sb-item"><span>Yozuvlar soni</span><span style={{color:"#FF6B1A"}}>{purchFiltered.length} ta</span></div>
        </>}
      </div>

      <div className="card" style={{marginTop:0}}>
        <div className="card-body" style={{padding:0}}>
          {list.length===0
            ? <div style={{padding:"24px",textAlign:"center",color:"#7a7060",fontWeight:700}}>Hech narsa topilmadi</div>
            : list.map(item => tab==="sales" ? (
              <div key={item.id} className="hist-row">
                <div className="hist-main">
                  <span className="hist-name">{item.productName}</span>
                  <span style={{fontSize:11,color:"#504840"}}>{fmtDate(item.date)}</span>
                </div>
                <div className="hist-right">
                  <div style={{textAlign:"right"}}>
                    <div style={{color:"#FFB800",fontWeight:900,fontSize:14}}>{fmt(item.sellPrice*item.qty)} so'm</div>
                    <div style={{fontSize:11,color:"#4CD964"}}>×{item.qty} · +{fmt((item.sellPrice-item.costPrice)*item.qty)} foyda</div>
                  </div>
                  <button className="del-btn" onClick={()=>delSale(item.id)}>🗑</button>
                </div>
              </div>
            ) : (
              <div key={item.id} className="hist-row">
                <div className="hist-main">
                  <span className="hist-name">{item.note}</span>
                  <span style={{fontSize:11,color:"#504840"}}>{fmtDate(item.date)}</span>
                </div>
                <div className="hist-right">
                  <span style={{color:"#E8291C",fontWeight:900}}>−{fmt(item.amount)} so'm</span>
                  <button className="del-btn" onClick={()=>delPurch(item.id)}>🗑</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
function AppStyle() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Bebas+Neue&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --orange:#FF6B1A;--red:#E8291C;--yellow:#FFB800;--green:#4CD964;
      --dark:#0c0b09;--card:#181612;--border:#252320;
      --text:#f0ead8;--muted:#7a7060;--muted2:#504840;
    }
    body{background:var(--dark);font-family:'Nunito',sans-serif;color:var(--text);padding-bottom:80px;}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
    input[type=number]{-moz-appearance:textfield;}
    select option{background:#1a1816;}

    .app-header{
      background:linear-gradient(135deg,#1a0a00,#2d1400,#1a0a00);
      padding:14px 16px 12px;border-bottom:2px solid var(--orange);
      display:flex;align-items:center;justify-content:space-between;
      position:sticky;top:0;z-index:100;
    }
    .hd-brand{display:flex;align-items:center;gap:10px;}
    .hd-logo{font-size:26px;background:var(--orange);width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(255,107,26,.5);}
    .hd-name{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;line-height:1;}
    .hd-name span{color:var(--orange);}
    .hd-sub{font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;font-weight:700;}
    .hd-view{font-size:12px;color:var(--muted);font-weight:700;}

    .bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:100;background:#100f0d;border-top:1px solid var(--border);display:flex;}
    .nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 2px 9px;border:none;background:transparent;color:var(--muted);cursor:pointer;font-family:'Nunito',sans-serif;font-size:10px;font-weight:700;transition:color .15s;}
    .nav-ico{font-size:18px;}
    .nav-btn.active{color:var(--orange);}

    .page{padding:12px 12px 16px;max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:10px;}
    .section-label{font-size:10px;font-weight:900;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);padding:0 2px;}

    .card{background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden;}
    .card-header{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
    .card-title{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1.5px;}
    .card-body{padding:14px 16px;}

    .stats-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .stats-row.four{grid-template-columns:1fr 1fr;}
    .stat-card{border-radius:14px;padding:11px 13px;border:1.5px solid var(--border);background:var(--card);}
    .stat-big{grid-column:1/-1;}
    .stat-label{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;}
    .stat-value{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;}
    .stat-unit{font-size:11px;opacity:.7;}
    .stat-orange .stat-value{color:var(--orange);}
    .stat-yellow .stat-value{color:var(--yellow);}
    .stat-green  .stat-value{color:var(--green);}
    .stat-red    .stat-value{color:var(--red);}

    .bar-chart{display:flex;gap:5px;height:90px;align-items:flex-end;}
    .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;}
    .bar-wrap{flex:1;width:100%;position:relative;display:flex;align-items:flex-end;}
    .bar-fill{width:100%;border-radius:4px 4px 0 0;background:rgba(255,107,26,.3);position:absolute;bottom:0;left:0;}
    .bar-profit{width:55%;border-radius:4px 4px 0 0;background:var(--green);position:absolute;bottom:0;left:22%;}
    .bar-label{font-size:9px;color:var(--muted);font-weight:700;white-space:nowrap;}
    .chart-legend{display:flex;gap:12px;margin-top:8px;}
    .leg-item{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--muted);}
    .leg-dot{width:7px;height:7px;border-radius:50%;}
    .leg-dot.orange{background:var(--orange);}
    .leg-dot.green{background:var(--green);}

    .top-row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);}
    .top-row:last-child{border-bottom:none;}
    .top-rank{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--orange);width:24px;flex-shrink:0;}
    .top-name{flex:1;font-weight:700;font-size:13px;}
    .top-info{display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
    .badge-qty{background:rgba(255,107,26,.15);color:var(--orange);border-radius:6px;padding:1px 7px;font-size:11px;font-weight:800;}
    .top-profit{color:var(--green);font-weight:800;font-size:12px;}

    .filter-row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:0 0 2px;flex-wrap:nowrap;}
    .filter-row::-webkit-scrollbar{display:none;}
    .filter-btn{flex-shrink:0;padding:5px 11px;border-radius:20px;border:1.5px solid var(--border);background:transparent;color:var(--muted);font-family:'Nunito',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:all .15s;white-space:nowrap;}
    .filter-btn.active{background:var(--orange);border-color:var(--orange);color:#fff;}

    .toolbar{display:flex;align-items:center;justify-content:space-between;padding:2px 0;}

    .prod-list{display:flex;flex-direction:column;gap:8px;}
    .prod-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:13px 15px;}
    .prod-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:9px;}
    .prod-name{font-weight:900;font-size:15px;}
    .prod-cat{font-size:11px;color:var(--muted);margin-top:2px;}
    .prod-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;}
    .ps-item{display:flex;flex-direction:column;gap:1px;}
    .ps-label{font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted);}
    .ps-val{font-weight:900;font-size:12px;}
    .ps-val.orange{color:var(--orange);}
    .ps-val.yellow{color:var(--yellow);}
    .ps-val.green{color:var(--green);}
    .ps-val.red{color:var(--red);}
    .ing-chips{display:flex;flex-wrap:wrap;gap:4px;}
    .ing-chip{background:#1e1c19;border:1px solid var(--border);border-radius:7px;padding:2px 8px;font-size:10px;font-weight:700;color:var(--muted);}

    .inp{width:100%;background:#111009;border:1.5px solid var(--border);border-radius:12px;padding:10px 13px;color:var(--text);font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;outline:none;transition:border-color .15s;}
    .inp::placeholder{color:#3a3528;}
    .inp:focus{border-color:var(--orange);}
    .inp-yellow:focus{border-color:var(--yellow);color:var(--yellow);}
    .inp-red:focus{border-color:var(--red);color:var(--red);}
    .inp-select{appearance:none;cursor:pointer;background:#111009 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%237a7060' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E") no-repeat right 12px center;}

    .btn-primary{background:var(--orange);color:#fff;border:none;border-radius:12px;padding:11px 16px;font-family:'Nunito',sans-serif;font-weight:800;font-size:14px;cursor:pointer;transition:all .2s;box-shadow:0 2px 12px rgba(255,107,26,.3);}
    .btn-primary.btn-success{background:var(--green);}
    .btn-red{background:var(--red);color:#fff;border:none;border-radius:12px;padding:11px 16px;font-family:'Nunito',sans-serif;font-weight:800;font-size:14px;cursor:pointer;transition:all .2s;}
    .btn-red.btn-success{background:var(--green);}
    .btn-orange{background:var(--orange);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-family:'Nunito',sans-serif;font-weight:900;font-size:16px;cursor:pointer;flex-shrink:0;}
    .del-btn{background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:15px;padding:3px;border-radius:6px;transition:color .15s;}
    .del-btn:hover{color:var(--red);}

    .modal-form{display:flex;flex-direction:column;gap:8px;}
    .form-label{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:2px;}
    .cat-select{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;}
    .cat-btn{padding:5px 10px;border-radius:10px;border:1.5px solid var(--border);background:transparent;color:var(--muted);font-family:'Nunito',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:all .15s;}
    .cat-btn.active{background:var(--orange);border-color:var(--orange);color:#fff;}
    .ing-form{display:flex;gap:6px;}
    .ing-row{display:flex;align-items:center;gap:8px;background:#111009;border:1px solid var(--border);border-radius:10px;padding:7px 12px;margin-bottom:4px;}
    .ing-dot{width:6px;height:6px;background:var(--orange);border-radius:50%;flex-shrink:0;}
    .cost-preview{background:#1a1200;border:1px solid #3a2800;border-radius:10px;padding:9px 13px;font-size:12px;font-weight:700;color:var(--muted);}

    .sale-preview{background:#111009;border:1px solid var(--border);border-radius:12px;padding:11px 13px;margin:8px 0;display:flex;flex-direction:column;gap:5px;}
    .sp-row{display:flex;justify-content:space-between;font-size:13px;font-weight:700;}
    .qty-btn{background:#1e1c19;border:1.5px solid var(--border);border-radius:10px;width:40px;height:40px;font-size:20px;font-weight:900;color:var(--text);cursor:pointer;flex-shrink:0;}
    .total-box{background:#0f1a0c;border:1.5px solid #2a4020;border-radius:12px;padding:11px 13px;display:flex;flex-direction:column;gap:4px;margin-top:10px;}

    .hist-row{display:flex;align-items:center;gap:10px;padding:10px 15px;border-bottom:1px solid var(--border);}
    .hist-row:last-child{border-bottom:none;}
    .hist-main{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0;}
    .hist-name{font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .hist-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}
    .badge-count{background:rgba(255,107,26,.15);color:var(--orange);border-radius:7px;padding:2px 8px;font-size:12px;font-weight:800;}
    .summary-bar{background:var(--card);border:1px solid var(--border);border-radius:13px;padding:11px 15px;display:flex;gap:16px;flex-wrap:wrap;}
    .sb-item{display:flex;flex-direction:column;gap:2px;font-size:11px;font-weight:700;color:var(--muted);}
    .sb-item span:last-child{font-size:15px;font-weight:900;}

    .tab-toggle{display:flex;background:var(--card);border:1px solid var(--border);border-radius:13px;overflow:hidden;}
    .tt-btn{flex:1;padding:9px;border:none;background:transparent;color:var(--muted);font-family:'Nunito',sans-serif;font-weight:800;font-size:12px;cursor:pointer;transition:all .15s;}
    .tt-btn.active{background:var(--orange);color:#fff;}

    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
    .modal-box{background:#1a1816;border-radius:22px 22px 0 0;border-top:2px solid var(--orange);width:100%;max-width:520px;max-height:92vh;overflow-y:auto;}
    .modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 13px;border-bottom:1px solid var(--border);position:sticky;top:0;background:#1a1816;z-index:1;}
    .modal-title{font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:1.5px;}
    .modal-body{padding:14px 18px 36px;}
    .empty-big{text-align:center;padding:36px 20px;}
    .dash{display:flex;flex-direction:column;gap:10px;}
  `}</style>;
}