import React, { useEffect, useState } from "react";
import useAuth from "../auth/useAuth";
import { db } from "../firebase";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const FALLBACK = process.env.REACT_APP_GOOGLE_CX;
const CX1 = process.env.REACT_APP_GOOGLE_CX_1 || FALLBACK || "";
const CX2 = process.env.REACT_APP_GOOGLE_CX_2 || "";
const CX1_LABEL = process.env.REACT_APP_GOOGLE_CX_1_LABEL || "Engine 1";
const CX2_LABEL = process.env.REACT_APP_GOOGLE_CX_2_LABEL || "Engine 2";

function loadEngine() {
  try {
    const saved = localStorage.getItem("cx_pref");
    if (saved === "1" || saved === "2") return saved;
  } catch {}
  return CX1 ? "1" : "2";
}

export default function Search() {
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");
  const [engine, setEngine] = useState(loadEngine());
  const [results, setResults] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const col = collection(db, "links");
    const qy = query(col, where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qy, (snap) => setSaved(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  const selectedCx = engine === "2" ? CX2 : CX1;

  const search = async () => {
    setLoading(true); setError(""); setResults([]);

    if (!API_KEY) { setError("Missing REACT_APP_GOOGLE_API_KEY in .env.local"); setLoading(false); return; }
    if (!selectedCx) {
      setError(engine === "2" ? "Missing REACT_APP_GOOGLE_CX_2 in .env.local"
                              : "Missing REACT_APP_GOOGLE_CX_1 (or REACT_APP_GOOGLE_CX) in .env.local");
      setLoading(false); return;
    }

    try {
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", API_KEY);
      url.searchParams.set("cx", selectedCx);
      url.searchParams.set("q", q);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Custom Search failed (${res.status})`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveLink = async (r) => {
    await addDoc(collection(db, "links"), {
      ownerId: user.uid,
      title: r.title,
      url: r.link,
      snippet: r.snippet || "",
      engine: engine === "2" ? CX2_LABEL : CX1_LABEL,
      createdAt: serverTimestamp(),
    });
  };

  const remove = async (id) => { await deleteDoc(doc(db, "links", id)); };

  const onEngineChange = (e) => {
    const v = e.target.value;
    setEngine(v);
    try { localStorage.setItem("cx_pref", v); } catch {}
  };

  return (
    <div className="page-wrap">
      <header style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px"}}>
        <div style={{fontWeight:800, fontSize:"1.1rem"}}>🔎 Google Search Saver</div>
        <div style={{display:"flex", gap:12, alignItems:"center"}}>
          <span>{user?.email}</span>
          <button onClick={logout} style={{padding:"8px 12px", borderRadius:10, border:"1px solid #ddd"}}>Logout</button>
        </div>
      </header>

      <main style={{display:"grid", gridTemplateColumns:"1.2fr .8fr", gap:20, padding:"0 20px 40px"}}>
        <section style={{background:"#fff", borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.08)", padding:16}}>
          <h2 style={{marginTop:0}}>Search</h2>
          <div style={{display:"grid", gridTemplateColumns:"1fr auto auto", gap:8}}>
            <input style={{padding:"10px 12px", borderRadius:12, border:"1px solid #ddd"}}
              value={q} onChange={e => setQ(e.target.value)} placeholder="Search term..." />
            <select value={engine} onChange={onEngineChange}
              style={{padding:"10px 12px", borderRadius:12, border:"1px solid #ddd"}} title="Choose search engine">
              {CX1 && <option value="1">{CX1_LABEL}</option>}
              {CX2 && <option value="2">{CX2_LABEL}</option>}
            </select>
            <button onClick={search} style={{padding:"10px 14px", borderRadius:12, border:"none", background:"#007bff", color:"#fff"}}>
              Search
            </button>
          </div>
          {loading && <div style={{marginTop:10}}>Loading…</div>}
          {error && <div style={{marginTop:10, background:"#ffe6e6", color:"#a40000", padding:"8px 10px", borderRadius:10}}>{error}</div>}
          <ul style={{listStyle:"none", padding:0, marginTop:14, display:"grid", gap:10}}>
            {results.map((r) => (
              <li key={r.cacheId || r.link} style={{border:"1px solid #eee", borderRadius:12, padding:12}}>
                <div style={{fontWeight:700}}>{r.title}</div>
                <div style={{fontSize:".9rem", color:"#0a58ca"}}>{r.link}</div>
                <div style={{fontSize:".9rem"}}>{r.snippet}</div>
                <button onClick={() => saveLink(r)} style={{marginTop:6, padding:"8px 12px", border:"1px solid #ddd", borderRadius:10}}>Save</button>
              </li>
            ))}
          </ul>
        </section>

        <section style={{background:"#fff", borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.08)", padding:16, position:"relative", overflow:"hidden"}}>
          <h2 style={{marginTop:0}}>Saved Links</h2>
          {saved.length === 0 && <div>No saved links yet.</div>}
          <ul style={{listStyle:"none", padding:0, margin:0, display:"grid", gap:10}}>
            {saved.map((s) => (
              <li key={s.id} style={{border:"1px solid #eee", borderRadius:12, padding:12}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <a href={s.url} target="_blank" rel="noreferrer" style={{fontWeight:700}}>{s.title || s.url}</a>
                  <button onClick={() => remove(s.id)} style={{background:"transparent", border:"1px solid #ddd", padding:"6px 10px", borderRadius:10}}>Delete</button>
                </div>
                <div style={{fontSize:".85rem", color:"#666"}}>Engine: {s.engine || (engine === "2" ? CX2_LABEL : CX1_LABEL)}</div>
                <div style={{fontSize:".9rem"}}>{s.snippet}</div>
              </li>
            ))}
          </ul>
          <div className="corner-image" aria-hidden="true" />
        </section>
      </main>
    </div>
  );
}
