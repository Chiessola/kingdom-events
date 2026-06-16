import { useState, useRef, useEffect } from "react";
import { inscrireOrganisateur, connecter, deconnecter, getUtilisateurConnecte, ecouterSession, demanderReinitialisation } from "./lib/auth";
import { getEvenementsApprouves, creerEvenement, getTousLesEvenements, changerStatutEvenement, supprimerEvenement } from "./lib/evenements";
import { uploaderMediasEvenement } from "./lib/storage";
import { supabase } from "./lib/supabase";

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  purple: "#2D1B69", purpleL: "#4A2FA0", purpleD: "#160D35",
  gold: "#C9A84C", goldL: "#E4C97A",
  ivory: "#FAF8F3", ivoryD: "#EEEADF",
  slate: "#2A2A38", slateL: "#5A5A72",
  white: "#FFFFFF", green: "#1E8A4C", red: "#B92B2B",
};

const ADMIN_EMAIL = "admin@kingdom.cm"; // doit correspondre à un profil avec role='admin' dans Supabase

// ── STYLES ───────────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Inter:wght@400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:${C.ivory};color:${C.slate}}
  .cin{font-family:'Cinzel',serif}
  nav{background:${C.purpleD};border-bottom:2px solid ${C.gold};height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:0;z-index:50}
  .logo{font-family:'Cinzel',serif;color:${C.gold};font-size:16px;font-weight:700;cursor:pointer}
  .logo em{color:#fff;font-style:normal}
  .nav-links{display:flex;gap:4px}
  .nb{background:none;border:none;color:rgba(255,255,255,.65);font-size:12px;font-weight:600;padding:7px 12px;border-radius:6px;cursor:pointer;transition:.15s}
  .nb:hover,.nb.on{color:${C.gold};background:rgba(255,255,255,.07)}
  .ncta{background:${C.gold};color:${C.purpleD};font-family:'Cinzel',serif;font-size:11px;font-weight:700;padding:9px 16px;border-radius:6px;border:none;cursor:pointer;letter-spacing:.4px}
  .ncta:hover{background:${C.goldL}}
  /* hero */
  .hero{background:linear-gradient(140deg,${C.purpleD} 0%,${C.purple} 70%,${C.purpleL} 100%);padding:64px 24px 48px;text-align:center}
  .hero h1{font-family:'Cinzel',serif;font-size:clamp(24px,4.5vw,48px);font-weight:900;color:#fff;line-height:1.15;margin-bottom:14px}
  .hero h1 span{color:${C.gold}}
  .hero p{font-size:15px;color:rgba(255,255,255,.7);max-width:480px;margin:0 auto 28px;line-height:1.65}
  .hbtns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  .btn{padding:13px 24px;border-radius:8px;border:none;cursor:pointer;font-weight:600;font-size:13px;transition:.2s}
  .btn-g{background:${C.gold};color:${C.purpleD};font-family:'Cinzel',serif}
  .btn-g:hover{background:${C.goldL};transform:translateY(-1px)}
  .btn-o{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.3)}
  .btn-o:hover{border-color:${C.gold};color:${C.gold}}
  .btn-p{background:${C.purple};color:#fff}
  .btn-p:hover{background:${C.purpleL}}
  .btn-r{background:${C.red};color:#fff}
  .stats{display:flex;justify-content:center;gap:40px;margin-top:40px;padding-top:28px;border-top:1px solid rgba(255,255,255,.1);flex-wrap:wrap}
  .stat .n{font-family:'Cinzel',serif;font-size:26px;font-weight:700;color:${C.gold}}
  .stat .l{font-size:10px;color:rgba(255,255,255,.45);letter-spacing:1.5px;text-transform:uppercase;margin-top:3px}
  /* filters */
  .filters{background:#fff;border-bottom:1px solid ${C.ivoryD};padding:12px 20px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .fl{font-size:11px;font-weight:700;color:${C.slateL};margin-right:2px}
  .chip{padding:5px 12px;border-radius:20px;border:1.5px solid ${C.ivoryD};background:#fff;font-size:11px;font-weight:600;color:${C.slateL};cursor:pointer;transition:.15s}
  .chip:hover,.chip.on{border-color:${C.purple};background:${C.purple};color:#fff}
  /* cards */
  .section{max-width:1080px;margin:0 auto;padding:36px 20px}
  .sec-title{font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:${C.purpleD};margin-bottom:6px}
  .sec-sub{font-size:12px;color:${C.slateL};margin-bottom:6px}
  .divider{width:44px;height:3px;background:${C.gold};border-radius:2px;margin-bottom:22px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:20px}
  .card{background:#fff;border-radius:12px;border:1px solid ${C.ivoryD};cursor:pointer;transition:.2s;overflow:hidden}
  .card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(45,27,105,.1);border-color:${C.purpleL}}
  .card-bar{height:4px;background:linear-gradient(90deg,${C.gold},${C.purpleL},${C.gold});background-size:200%;animation:bar 3s linear infinite}
  @keyframes bar{to{background-position:200%}}
  .card-img{height:150px;display:flex;align-items:center;justify-content:center;font-size:52px;position:relative}
  .cbadge{position:absolute;top:10px;right:10px;padding:3px 9px;border-radius:20px;font-family:'Cinzel',serif;font-size:10px;font-weight:700}
  .cbadge-pay{background:${C.gold};color:${C.purpleD}}
  .cbadge-free{background:${C.green};color:#fff}
  .card-body{padding:16px}
  .card-type{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.purpleL};margin-bottom:6px}
  .card-title{font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:${C.purpleD};margin-bottom:10px;line-height:1.3}
  .meta{font-size:11px;color:${C.slateL};line-height:2}
  .card-foot{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid ${C.ivoryD};margin-top:12px}
  .price{font-family:'Cinzel',serif;font-size:15px;font-weight:700;color:${C.purple}}
  .price-free{color:${C.green}}
  .btn-sm{padding:8px 14px;border-radius:6px;border:none;cursor:pointer;font-size:11px;font-weight:700;background:${C.purple};color:#fff;transition:.15s}
  .btn-sm:hover{background:${C.purpleL}}
  /* auth */
  .auth-wrap{min-height:100vh;background:linear-gradient(135deg,${C.purpleD},${C.purple});display:flex;align-items:center;justify-content:center;padding:24px}
  .auth-box{background:#fff;border-radius:16px;padding:36px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
  .auth-title{font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:${C.purpleD};text-align:center;margin-bottom:4px}
  .auth-sub{font-size:12px;color:${C.slateL};text-align:center;margin-bottom:22px}
  .tabs2{display:flex;background:${C.ivory};border-radius:8px;padding:3px;gap:3px;margin-bottom:20px}
  .tab2{flex:1;padding:8px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;background:transparent;color:${C.slateL};transition:.15s}
  .tab2.on{background:#fff;color:${C.purple};box-shadow:0 1px 6px rgba(0,0,0,.1)}
  .fg{margin-bottom:14px}
  .fl2{display:block;font-size:11px;font-weight:700;color:${C.slate};margin-bottom:5px}
  .fi{width:100%;padding:11px 13px;border:1.5px solid ${C.ivoryD};border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;outline:none;transition:.15s;color:${C.slate}}
  .fi:focus{border-color:${C.purple}}
  select.fi{background:#fff}
  textarea.fi{min-height:90px;resize:vertical}
  .frow{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .alert-e{background:rgba(185,43,43,.08);border:1px solid rgba(185,43,43,.2);color:${C.red};font-size:12px;padding:9px 13px;border-radius:7px;margin-bottom:14px}
  .alert-s{background:rgba(30,138,76,.08);border:1px solid rgba(30,138,76,.2);color:${C.green};font-size:12px;padding:9px 13px;border-radius:7px;margin-bottom:14px}
  .back-link{text-align:center;font-size:12px;color:${C.slateL};margin-top:16px;cursor:pointer}
  .back-link:hover{color:${C.purple}}
  .btn-full{width:100%;padding:14px;border-radius:9px;border:none;cursor:pointer;font-family:'Cinzel',serif;font-size:13px;font-weight:700;background:${C.purple};color:#fff;letter-spacing:.4px;transition:.2s;display:flex;align-items:center;justify-content:center;gap:8px}
  .btn-full:hover:not(:disabled){background:${C.purpleL}}
  .btn-full:disabled{opacity:.55;cursor:not-allowed}
  /* upload */
  .up-zone{display:flex;flex-direction:column;align-items:center;gap:8px;border:2px dashed ${C.gold};border-radius:10px;padding:24px;text-align:center;margin-bottom:10px;transition:.2s}
  .up-zone:hover{background:rgba(201,168,76,.05)}
  .up-zone label{background:${C.purple};color:#fff;padding:9px 18px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;display:inline-block}
  .up-zone label:hover{background:${C.purpleL}}
  .thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-top:8px}
  .thumb{position:relative;aspect-ratio:1;border-radius:7px;overflow:hidden;border:1px solid ${C.ivoryD}}
  .thumb img{width:100%;height:100%;object-fit:cover}
  .thumb-vid{width:100%;height:100%;background:${C.purpleD};display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:10px;gap:4px}
  .thumb-rm{position:absolute;top:3px;right:3px;background:rgba(185,43,43,.9);color:#fff;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:700}
  .prog-bar{height:5px;background:${C.ivoryD};border-radius:3px;margin:6px 0;overflow:hidden}
  .prog-fill{height:100%;background:linear-gradient(90deg,${C.purple},${C.gold});border-radius:3px;transition:width .2s}
  /* dashboard */
  .dash-head{background:${C.purpleD};padding:16px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${C.gold}}
  .dash-name{font-family:'Cinzel',serif;color:${C.gold};font-size:14px;font-weight:700}
  .dash-sub{color:rgba(255,255,255,.5);font-size:11px;margin-top:2px}
  .btn-logout{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px}
  .btn-logout:hover{background:rgba(255,255,255,.2)}
  .date-block{background:${C.ivory};border:1px solid ${C.ivoryD};border-radius:10px;padding:16px;margin-bottom:16px}
  .date-block-title{font-family:'Cinzel',serif;font-size:11px;font-weight:700;color:${C.purpleD};letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
  /* admin */
  .admin-tabs{background:#fff;border-bottom:1px solid ${C.ivoryD};display:flex;padding:0 24px}
  .atab{padding:14px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:${C.slateL};border-bottom:3px solid transparent;transition:.15s}
  .atab.on{color:${C.purple};border-bottom-color:${C.purple}}
  .tbl{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  .tbl th{padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${C.slateL};background:${C.ivory};border-bottom:1px solid ${C.ivoryD};text-align:left}
  .tbl td{padding:13px 14px;font-size:12px;border-bottom:1px solid ${C.ivoryD};vertical-align:middle}
  .badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700}
  .badge-w{background:rgba(201,168,76,.15);color:#8B6914}
  .badge-a{background:rgba(30,138,76,.12);color:${C.green}}
  .badge-r{background:rgba(185,43,43,.1);color:${C.red}}
  .stat-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:24px}
  .scard{background:#fff;border-radius:10px;padding:18px;border-left:4px solid var(--c);box-shadow:0 2px 8px rgba(0,0,0,.06)}
  .scard .v{font-family:'Cinzel',serif;font-size:26px;font-weight:700;color:var(--c)}
  .scard .k{font-size:10px;color:${C.slateL};text-transform:uppercase;letter-spacing:1px;margin-top:3px}
  /* modal */
  .overlay{position:fixed;inset:0;background:rgba(22,13,53,.8);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
  .mbox{background:#fff;border-radius:14px;padding:28px;width:100%;max-width:520px;max-height:88vh;overflow-y:auto;position:relative}
  .mclose{position:absolute;top:14px;right:14px;background:${C.ivory};border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center}
  /* detail */
  .det-hero{background:linear-gradient(135deg,${C.purpleD},${C.purple});padding:36px 24px;color:#fff}
  .det-body{max-width:1080px;margin:0 auto;padding:32px 20px;display:grid;grid-template-columns:1fr 320px;gap:28px}
  @media(max-width:680px){.det-body{grid-template-columns:1fr}.frow{grid-template-columns:1fr}}
  .info-box{background:#fff;border:1px solid ${C.ivoryD};border-radius:12px;padding:22px;height:fit-content;position:sticky;top:72px}
  .irow{display:flex;gap:10px;margin-bottom:14px;align-items:flex-start}
  .ik{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${C.slateL}}
  .iv{font-size:13px;font-weight:500;color:${C.slate};margin-top:2px}
  .price-box{background:${C.ivory};border-radius:8px;padding:14px;text-align:center;margin:16px 0}
  .price-main{font-family:'Cinzel',serif;font-size:24px;font-weight:700;color:${C.purple}}
  /* org landing */
  .org-hero{background:linear-gradient(135deg,${C.purpleD},${C.slateL});padding:52px 24px;text-align:center}
  .steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:32px}
  .step{background:#fff;border-radius:10px;padding:20px;border:1px solid ${C.ivoryD};text-align:center}
  .snum{width:36px;height:36px;background:${C.purple};color:${C.gold};border-radius:50%;font-family:'Cinzel',serif;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
  .st{font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:${C.purpleD};margin-bottom:6px}
  .sd{font-size:12px;color:${C.slateL};line-height:1.5}
  /* footer */
  footer{background:${C.purpleD};border-top:2px solid ${C.gold};padding:40px 24px 20px;margin-top:56px}
  .ftop{display:grid;grid-template-columns:2fr 1fr 1fr;gap:32px;max-width:1080px;margin:0 auto 32px}
  @media(max-width:600px){.ftop{grid-template-columns:1fr}}
  .fl3{font-family:'Cinzel',serif;font-size:11px;font-weight:700;color:${C.gold};letter-spacing:1px;margin-bottom:12px}
  .flink{display:block;font-size:12px;color:rgba(255,255,255,.45);margin-bottom:7px;cursor:pointer}
  .flink:hover{color:${C.gold}}
  .fbot{border-top:1px solid rgba(255,255,255,.1);padding-top:18px;font-size:11px;color:rgba(255,255,255,.25);text-align:center;max-width:1080px;margin:0 auto}
  .form-card{background:#fff;border-radius:14px;padding:30px;border:1px solid ${C.ivoryD};max-width:620px;margin:0 auto}
`;

// ── DONNÉES EXEMPLE ───────────────────────────────────────────────────────────
const SAMPLE = [
  { id:1, emoji:"🎵", bg:"#1E0F3C", type:"Concert Gospel", titre:"Nuit de Louange — Douala Revival", org:"Ministère Lumière de Grâce", dateDebut:"2025-06-28", dateFin:"2025-06-28", heureDebut:"19:00", heureFin:"23:00", lieu:"Palais des Sports de Douala", ville:"Douala", desc:"Une nuit exceptionnelle de louange et d'adoration réunissant les plus grands artistes gospel du Cameroun.", prix:15000, tags:["Gospel","Louange","Douala"] },
  { id:2, emoji:"✝️", bg:"#0F3C1E", type:"Croisade", titre:"Grande Croisade d'Évangélisation Yaoundé 2025", org:"Église Centrale du Réveil", dateDebut:"2025-07-04", dateFin:"2025-07-06", heureDebut:"18:30", lieu:"Esplanade Stade Omnisports", ville:"Yaoundé", desc:"Trois nuits de puissante prédication de l'Évangile avec guérisons, miracles et témoignages.", prix:0, tags:["Croisade","Gratuit","Yaoundé"] },
  { id:3, emoji:"📖", bg:"#3C1E0F", type:"Séminaire", titre:"Leadership Chrétien — Bâtisseurs du Royaume", org:"Institut Biblique Emmanuel", dateDebut:"2025-07-13", dateFin:"2025-07-13", heureDebut:"09:00", heureFin:"17:00", lieu:"Hôtel Akwa Palace", ville:"Douala", desc:"Séminaire intensif pour leaders d'églises, pasteurs et responsables de ministères.", prix:8000, tags:["Leadership","Formation","Douala"] },
  { id:4, emoji:"🙏", bg:"#1E1E3C", type:"Nuit de Prière", titre:"Veillée Nationale — 100 Nuits pour le Cameroun", org:"Coalition des Églises", dateDebut:"2025-07-18", dateFin:"2025-07-19", heureDebut:"22:00", heureFin:"05:00", lieu:"Place de la Réconciliation", ville:"Yaoundé", desc:"Nuit d'intercession pour la paix, la guérison nationale et le réveil spirituel.", prix:0, tags:["Prière","Intercession","National"] },
  { id:5, emoji:"👨‍👩‍👧", bg:"#3C2E0F", type:"Retraite", titre:"Camp Famille en Christ — Kribi 2025", org:"Église Nouvelle Alliance", dateDebut:"2025-07-25", dateFin:"2025-07-27", heureDebut:"08:00", lieu:"Centre Chrétien Kribi", ville:"Kribi", desc:"Week-end de ressourcement pour familles chrétiennes. Ateliers couple, activités enfants, louange au bord de l'océan.", prix:25000, tags:["Famille","Retraite","Kribi"] },
  { id:6, emoji:"🎤", bg:"#2E0F3C", type:"Concert Gospel", titre:"Fresh Fire — Soirée Worship Contemporain", org:"House of Prayer Bafoussam", dateDebut:"2025-08-02", dateFin:"2025-08-02", heureDebut:"18:00", heureFin:"21:00", lieu:"Salle des Fêtes Municipale", ville:"Bafoussam", desc:"Concert de worship contemporain pour la jeunesse. Musique live et message pour la génération montante.", prix:5000, tags:["Worship","Jeunesse","Bafoussam"] },
];
const VILLES = ["Toutes","Douala","Yaoundé","Bafoussam","Kribi"];
const TYPES  = ["Tous","Concert Gospel","Croisade","Séminaire","Nuit de Prière","Retraite"];

// ── UPLOAD ZONE ───────────────────────────────────────────────────────────────
function UploadZone({ label, icon, accept, files, onAdd, onRemove, max, maxMB }) {
  const uid = useRef("uz_" + Math.random().toString(36).slice(2));
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const readAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const process = async (raw) => {
    setErr(""); setLoading(true);
    const valid = [];
    for (const f of Array.from(raw)) {
      if (files.length + valid.length >= max) { setErr(`Maximum ${max} fichiers.`); break; }
      const mb = f.size / 1024 / 1024;
      if (mb > maxMB) { setErr(`"${f.name}" dépasse ${maxMB} Mo.`); continue; }
      try {
        const base64 = await readAsBase64(f);
        valid.push({
          id: Date.now() + Math.random(),
          file: f,
          name: f.name,
          url: base64,
          mb: mb.toFixed(1),
          isImg: f.type.startsWith("image/"),
        });
      } catch { setErr(`Erreur lecture : ${f.name}`); }
    }
    if (valid.length) onAdd(valid);
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily:"Cinzel,serif", fontSize:12, fontWeight:700, color:C.purpleD, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
        <span>{icon}</span>{label}
        <span style={{ marginLeft:"auto", fontSize:10, color:C.slateL }}>{files.length}/{max}</span>
      </div>

      {files.length < max && (
        <div className="up-zone">
          <span style={{ fontSize:32 }}>{loading ? "⏳" : icon}</span>
          <div style={{ fontSize:12, color:C.slateL }}>
            {loading ? "Lecture en cours..." : "Cliquez pour choisir vos fichiers"}
          </div>
          {!loading && (
            <label htmlFor={uid.current} style={{ background:C.purple, color:"#fff", padding:"9px 18px", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", display:"inline-block" }}>
              📂 Parcourir
              <input
                id={uid.current}
                type="file"
                accept={accept}
                multiple
                style={{ display:"none" }}
                onChange={e => { if (e.target.files?.length) process(e.target.files); e.target.value = ""; }}
              />
            </label>
          )}
          <div style={{ fontSize:10, color:C.slateL }}>
            {accept.includes("image") ? "JPG, PNG, WEBP, GIF" : "MP4, MOV, AVI"} · Max {maxMB} Mo
          </div>
        </div>
      )}

      {err && <div className="alert-e">⚠️ {err}</div>}

      {files.length > 0 && (
        <div className="thumbs">
          {files.map(f => (
            <div key={f.id} className="thumb">
              {f.isImg
                ? <img src={f.url} alt={f.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div className="thumb-vid"><span>🎬</span><span style={{ fontSize:9, padding:"0 4px", textAlign:"center" }}>{f.name.slice(0,12)}</span></div>
              }
              <button className="thumb-rm" onClick={() => onRemove(f.id)}>✕</button>
              <div style={{ position:"absolute", bottom:2, left:2, background:"rgba(0,0,0,.6)", color:"#fff", fontSize:8, padding:"1px 4px", borderRadius:3 }}>{f.mb}Mo</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── INSCRIPTION MODALE ────────────────────────────────────────────────────────
function RegisterModal({ event, onClose }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ nom:"", tel:"", pay:"mtn" });
  const ref = "KEC-" + Math.random().toString(36).slice(2,8).toUpperCase();

  if (step === 2) return (
    <div className="overlay" onClick={onClose}>
      <div className="mbox" style={{ textAlign:"center" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
        <div className="cin" style={{ fontSize:18, fontWeight:700, color:C.purpleD, marginBottom:8 }}>Inscription confirmée !</div>
        <div style={{ fontSize:13, color:C.slateL, marginBottom:20, lineHeight:1.6 }}>
          Votre place pour <strong>{event.titre}</strong> est réservée.<br/>Votre ticket vous sera envoyé par WhatsApp.
        </div>
        <div style={{ background:C.ivory, border:`2px dashed ${C.gold}`, borderRadius:10, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:48 }}>📲</div>
          <div className="cin" style={{ fontSize:13, color:C.purple, fontWeight:700, marginTop:6 }}>{ref}</div>
          <div style={{ fontSize:10, color:C.slateL, marginTop:4 }}>Présentez ce code à l'entrée</div>
        </div>
        <button className="btn btn-g" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );

  return (
    <div className="overlay" onClick={onClose}>
      <div className="mbox" onClick={e=>e.stopPropagation()}>
        <button className="mclose" onClick={onClose}>✕</button>
        <div className="cin" style={{ fontSize:16, fontWeight:700, color:C.purpleD, marginBottom:4 }}>Réserver ma place</div>
        <div style={{ fontSize:12, color:C.slateL, marginBottom:20 }}>{event.titre}</div>
        <div className="fg"><label className="fl2">Nom complet</label><input className="fi" placeholder="Marie Ngono" value={f.nom} onChange={e=>setF({...f,nom:e.target.value})} /></div>
        <div className="fg"><label className="fl2">Téléphone</label><input className="fi" placeholder="6XX XXX XXX" value={f.tel} onChange={e=>setF({...f,tel:e.target.value})} /></div>
        {!event.free && (
          <div className="fg">
            <label className="fl2">Paiement</label>
            <div style={{ display:"flex", gap:8 }}>
              {[["mtn","🟡 MTN Money"],["orange","🟠 Orange Money"]].map(([k,l])=>(
                <button key={k} onClick={()=>setF({...f,pay:k})} style={{ flex:1, padding:10, borderRadius:8, border:`2px solid ${f.pay===k?C.purple:C.ivoryD}`, background:f.pay===k?"rgba(45,27,105,.06)":"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:f.pay===k?C.purple:C.slateL }}>{l}</button>
              ))}
            </div>
          </div>
        )}
        <div className="price-box">
          <div className="price-main">{event.prix===0?"Gratuit":`${event.prix.toLocaleString()} FCFA`}</div>
          <div style={{ fontSize:11, color:C.slateL, marginTop:3 }}>par personne</div>
        </div>
        <button className="btn-full" disabled={!f.nom||!f.tel} onClick={()=>setStep(2)}>
          {event.prix===0?"Confirmer":"Payer et réserver →"}
        </button>
      </div>
    </div>
  );
}

// ── CARD ÉVÉNEMENT ────────────────────────────────────────────────────────────
function Card({ ev, onClick }) {
  return (
    <div className="card" onClick={()=>onClick(ev)}>
      <div className="card-bar"/>
      <div className="card-img" style={{ background:ev.bg||C.purpleD }}>
        <span>{ev.emoji||"🎵"}</span>
        <span className={`cbadge ${ev.prix===0?"cbadge-free":"cbadge-pay"}`}>
          {ev.prix===0?"Gratuit":`${ev.prix?.toLocaleString()} FCFA`}
        </span>
      </div>
      <div className="card-body">
        <div className="card-type">{ev.type}</div>
        <div className="card-title">{ev.titre}</div>
        <div className="meta">
          <div>📅 {ev.dateDebut}{ev.dateFin&&ev.dateFin!==ev.dateDebut?` → ${ev.dateFin}`:""}</div>
          <div>📍 {ev.lieu}, {ev.ville}</div>
          <div>🏛️ {ev.org||ev.eglise}</div>
        </div>
        <div className="card-foot">
          <div className={`price ${ev.prix===0?"price-free":""}`}>{ev.prix===0?"Gratuit":`${ev.prix?.toLocaleString()} FCFA`}</div>
          <button className="btn-sm" onClick={e=>{e.stopPropagation();onClick(ev)}}>Voir →</button>
        </div>
      </div>
    </div>
  );
}

// ── DÉTAIL ÉVÉNEMENT ──────────────────────────────────────────────────────────
function Detail({ ev, onBack, onRegister }) {
  return (
    <div>
      <div className="det-hero">
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <button className="btn btn-o" style={{ marginBottom:20, fontSize:12 }} onClick={onBack}>← Retour</button>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:C.gold, textTransform:"uppercase", marginBottom:8 }}>{ev.type}</div>
          <div className="cin" style={{ fontSize:"clamp(20px,3.5vw,36px)", fontWeight:900, color:"#fff", marginBottom:8 }}>{ev.emoji} {ev.titre}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.65)" }}>Par <strong>{ev.org||ev.eglise}</strong></div>
        </div>
      </div>
      <div className="det-body">
        <div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
            {(ev.tags||[]).map(t=><span key={t} style={{ background:C.ivory, border:`1px solid ${C.ivoryD}`, color:C.slateL, fontSize:11, padding:"3px 10px", borderRadius:20 }}>{t}</span>)}
          </div>
          <div style={{ fontSize:14, lineHeight:1.75, color:C.slate, marginBottom:16 }}>{ev.desc}</div>
          {ev.photos?.length>0&&(
            <div style={{ marginTop:20 }}>
              <div className="cin" style={{ fontSize:13, fontWeight:700, color:C.purpleD, marginBottom:10 }}>🖼️ Photos</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8 }}>
                {ev.photos.map((p,i)=><img key={i} src={p.url} alt={p.name} style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:8, border:`1px solid ${C.ivoryD}` }}/>)}
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="info-box">
            {[["📅","Dates",ev.dateDebut+(ev.dateFin&&ev.dateFin!==ev.dateDebut?` → ${ev.dateFin}`:"")],
              ["⏰","Horaires",(ev.heureDebut||"")+(ev.heureFin?` – ${ev.heureFin}`:"")],
              ["📍","Lieu",ev.lieu],["🏙️","Ville",ev.ville],["🏛️","Organisateur",ev.org||ev.eglise]
            ].map(([ic,k,v])=>v&&(
              <div key={k} className="irow">
                <span style={{ fontSize:18 }}>{ic}</span>
                <div><div className="ik">{k}</div><div className="iv">{v}</div></div>
              </div>
            ))}
            <div className="price-box">
              <div className={`price-main ${ev.prix===0?"price-free":""}`}>{ev.prix===0?"Gratuit":`${ev.prix?.toLocaleString()} FCFA`}</div>
              <div style={{ fontSize:11, color:C.slateL, marginTop:3 }}>par personne</div>
            </div>
            <button className="btn-full" onClick={onRegister}>Réserver ma place →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AUTH ORGANISATEUR (connecté à Supabase) ─────────────────────────────────
function OrgAuth({ onBack, onLogin }) {
  const [tab, setTab] = useState("login");
  const [f, setF] = useState({ email:"", pwd:"", eglise:"", nom:"", prenom:"", ville:"" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setOk(""); setLoading(true);
    try {
      if (tab === "register") {
        if (!f.eglise) { setErr("Nom de l'église requis."); setLoading(false); return; }
        if (f.pwd.length < 6) { setErr("Mot de passe trop court (min. 6 caractères)."); setLoading(false); return; }
        await inscrireOrganisateur({
          email: f.email, password: f.pwd, nom: f.nom, prenom: f.prenom,
          nomEglise: f.eglise, ville: f.ville,
        });
        setOk("Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.");
        setTab("login");
      } else {
        const user = await connecter(f.email, f.pwd);
        onLogin(user);
      }
    } catch (e) {
      const msg = e.message?.includes("Invalid login") ? "Email ou mot de passe incorrect."
        : e.message?.includes("already registered") ? "Cet email est déjà utilisé."
        : e.message;
      setErr(msg);
    }
    setLoading(false);
  };

  const motDePasseOublie = async () => {
    if (!f.email) { setErr("Entrez votre email d'abord."); return; }
    try {
      await demanderReinitialisation(f.email);
      setOk("Email de réinitialisation envoyé ! Vérifiez votre boîte mail.");
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-title">Kingdom <span style={{ color:C.gold }}>Events</span></div>
        <div className="auth-sub">Espace Organisateur</div>
        <div className="tabs2">
          {[["login","Se connecter"],["register","Créer un compte"]].map(([k,l])=>(
            <button key={k} className={`tab2 ${tab===k?"on":""}`} onClick={()=>{setTab(k);setErr("");setOk("")}}>{l}</button>
          ))}
        </div>
        {err&&<div className="alert-e">⚠️ {err}</div>}
        {ok&&<div className="alert-s">✅ {ok}</div>}
        {tab==="register"&&<>
          <div className="fg"><label className="fl2">Nom de l'église / ministère *</label><input className="fi" placeholder="Ex: Église Nouvelle Alliance" value={f.eglise} onChange={e=>setF({...f,eglise:e.target.value})}/></div>
          <div className="frow">
            <div className="fg"><label className="fl2">Prénom</label><input className="fi" value={f.prenom} onChange={e=>setF({...f,prenom:e.target.value})}/></div>
            <div className="fg"><label className="fl2">Nom</label><input className="fi" value={f.nom} onChange={e=>setF({...f,nom:e.target.value})}/></div>
          </div>
          <div className="fg"><label className="fl2">Ville</label>
            <select className="fi" value={f.ville} onChange={e=>setF({...f,ville:e.target.value})}>
              <option value="">Choisir...</option>
              {["Douala","Yaoundé","Bafoussam","Kribi","Autre"].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
        </>}
        <div className="fg"><label className="fl2">Email *</label><input className="fi" type="email" placeholder="votre@email.com" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
        <div className="fg"><label className="fl2">Mot de passe *</label><input className="fi" type="password" placeholder="Min. 6 caractères" value={f.pwd} onChange={e=>setF({...f,pwd:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        <button className="btn-full" disabled={loading||!f.email||!f.pwd} onClick={submit}>
          {loading?"⏳ Chargement...":tab==="register"?"Créer mon compte →":"Accéder à mon espace →"}
        </button>
        {tab==="login"&&<div className="back-link" onClick={motDePasseOublie}>Mot de passe oublié ?</div>}
        <div className="back-link" onClick={onBack}>← Retour au site</div>
      </div>
    </div>
  );
}

// ── DASHBOARD ORGANISATEUR ────────────────────────────────────────────────────
function OrgDash({ user, onLogout, onSubmit }) {
  const [f, setF] = useState({ eglise:user.organisateur?.nom_eglise||"", type:"", titre:"", dateDebut:"", dateFin:"", heureDebut:"", heureFin:"", lieu:"", ville:"", prix:"", desc:"" });
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [prog, setProg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!f.titre||!f.eglise) { setErr("Titre et nom de l'église requis."); return; }
    if (!user.organisateur?.id) { setErr("Profil organisateur introuvable. Réessayez de vous reconnecter."); return; }
    setErr(""); setLoading(true); setProg(5);

    try {
      // 1. Crée l'événement en base
      const evenement = await creerEvenement(user.organisateur.id, f);
      setProg(25);

      // 2. Upload les photos et vidéos vers Supabase Storage
      const tousMedias = [...photos, ...videos];
      if (tousMedias.length > 0) {
        await uploaderMediasEvenement(evenement.id, tousMedias, (pct) => {
          setProg(25 + Math.round(pct * 0.7)); // de 25% à 95%
        });
      }

      setProg(100);
      if (onSubmit) onSubmit(evenement);
      setDone(true);
    } catch (e) {
      setErr("Erreur : " + e.message);
    }
    setLoading(false);
  };

  if (done) return (
    <div>
      <div className="dash-head"><div><div className="dash-name">{user.organisateur?.nom_eglise}</div></div><button className="btn-logout" onClick={onLogout}>Déconnexion</button></div>
      <div className="section" style={{ textAlign:"center", paddingTop:60 }}>
        <div style={{ fontSize:56, marginBottom:14 }}>🙌</div>
        <div className="cin" style={{ fontSize:20, fontWeight:700, color:C.purpleD, marginBottom:8 }}>Événement soumis !</div>
        <div style={{ fontSize:13, color:C.slateL, marginBottom:24, lineHeight:1.6 }}>
          <strong>{f.titre}</strong> a été envoyé.<br/>
          {photos.length>0&&`${photos.length} photo${photos.length>1?"s":""} `}{videos.length>0&&`${videos.length} vidéo${videos.length>1?"s":""} `}
          {(photos.length+videos.length)>0&&"uploadée(s). "}Il sera visible après validation (24h).
        </div>
        <button className="btn btn-g" onClick={()=>{setDone(false);setF({eglise:user.organisateur?.nom_eglise||"",type:"",titre:"",dateDebut:"",dateFin:"",heureDebut:"",heureFin:"",lieu:"",ville:"",prix:"",desc:""});setPhotos([]);setVideos([]);setProg(0);}}>
          Publier un autre événement
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="dash-head">
        <div><div className="dash-name">{user.organisateur?.nom_eglise}</div><div className="dash-sub">{user.email}</div></div>
        <button className="btn-logout" onClick={onLogout}>Déconnexion</button>
      </div>
      <div className="section">
        <div className="form-card">
          <div className="cin sec-title">Publier un événement</div>
          <div className="divider"/>
          {err&&<div className="alert-e">{err}</div>}
          <div className="fg"><label className="fl2">Église / Ministère *</label><input className="fi" value={f.eglise} onChange={e=>setF({...f,eglise:e.target.value})} disabled={loading}/></div>
          <div className="frow">
            <div className="fg"><label className="fl2">Type</label>
              <select className="fi" value={f.type} onChange={e=>setF({...f,type:e.target.value})} disabled={loading}>
                <option value="">Choisir...</option>
                {["Concert Gospel","Croisade","Séminaire","Nuit de Prière","Retraite Familiale","Autre"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl2">Ville</label>
              <select className="fi" value={f.ville} onChange={e=>setF({...f,ville:e.target.value})} disabled={loading}>
                <option value="">Choisir...</option>
                {["Douala","Yaoundé","Bafoussam","Kribi","Autre"].map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="fg"><label className="fl2">Titre *</label><input className="fi" placeholder="Ex: Grande Croisade de Réveil 2025" value={f.titre} onChange={e=>setF({...f,titre:e.target.value})} disabled={loading}/></div>

          <div className="date-block">
            <div className="date-block-title">📅 Dates & Horaires</div>
            <div className="frow">
              <div className="fg"><label className="fl2">Date de début *</label><input className="fi" type="date" value={f.dateDebut} onChange={e=>setF({...f,dateDebut:e.target.value})} disabled={loading}/></div>
              <div className="fg"><label className="fl2">Heure de début</label><input className="fi" type="time" value={f.heureDebut} onChange={e=>setF({...f,heureDebut:e.target.value})} disabled={loading}/></div>
            </div>
            <div className="frow">
              <div className="fg"><label className="fl2">Date de fin</label><input className="fi" type="date" min={f.dateDebut} value={f.dateFin} onChange={e=>setF({...f,dateFin:e.target.value})} disabled={loading}/></div>
              <div className="fg"><label className="fl2">Heure de fin</label><input className="fi" type="time" value={f.heureFin} onChange={e=>setF({...f,heureFin:e.target.value})} disabled={loading}/></div>
            </div>
          </div>

          <div className="frow">
            <div className="fg"><label className="fl2">Lieu précis</label><input className="fi" placeholder="Palais des Sports" value={f.lieu} onChange={e=>setF({...f,lieu:e.target.value})} disabled={loading}/></div>
            <div className="fg"><label className="fl2">Prix FCFA (0 = gratuit)</label><input className="fi" type="number" placeholder="0" value={f.prix} onChange={e=>setF({...f,prix:e.target.value})} disabled={loading}/></div>
          </div>
          <div className="fg"><label className="fl2">Description</label><textarea className="fi" placeholder="Décrivez votre événement..." value={f.desc} onChange={e=>setF({...f,desc:e.target.value})} disabled={loading}/></div>

          <div style={{ borderTop:`1px solid ${C.ivoryD}`, paddingTop:20, marginTop:4 }}>
            <UploadZone label="Photos de l'événement" icon="🖼️" accept="image/*" files={photos} onAdd={v=>setPhotos(p=>[...p,...v].slice(0,6))} onRemove={id=>setPhotos(p=>p.filter(f=>f.id!==id))} max={6} maxMB={5}/>
            <UploadZone label="Vidéos de présentation" icon="🎬" accept="video/*" files={videos} onAdd={v=>setVideos(p=>[...p,...v].slice(0,2))} onRemove={id=>setVideos(p=>p.filter(f=>f.id!==id))} max={2} maxMB={50}/>
          </div>

          {loading&&(
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.slateL, marginBottom:4 }}><span>Envoi en cours...</span><span>{prog}%</span></div>
              <div className="prog-bar"><div className="prog-fill" style={{ width:`${prog}%` }}/></div>
            </div>
          )}

          <button className="btn-full" disabled={loading||!f.titre||!f.eglise} onClick={submit}>
            {loading?`⏳ ${prog}% — Patientez...`:`Publier l'événement${photos.length+videos.length>0?` + ${photos.length+videos.length} média${photos.length+videos.length>1?"s":""}`:""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PAGE ORGANISATEUR ─────────────────────────────────────────────────────────
function OrgPage({ user, onRequestAuth, onLogout, onSubmit }) {
  if (user) return <OrgDash user={user} onLogout={onLogout} onSubmit={onSubmit}/>;
  const steps=[["1","Créez votre compte","Inscrivez votre église gratuitement en 2 minutes."],["2","Publiez","Remplissez la fiche de votre croisade, concert ou séminaire."],["3","Gérez","Suivez les inscriptions et paiements Mobile Money en temps réel."],["4","Accueillez","Scannez les tickets QR à l'entrée."]];
  return (
    <div>
      <div className="org-hero">
        <div className="cin" style={{ fontSize:"clamp(22px,4vw,38px)", fontWeight:900, color:"#fff", marginBottom:12 }}>Espace <span style={{ color:C.gold }}>Organisateur</span></div>
        <div style={{ fontSize:15, color:"rgba(255,255,255,.7)", marginBottom:28 }}>Publiez vos événements chrétiens et touchez plus de fidèles.</div>
        <button className="btn btn-g" onClick={onRequestAuth}>Accéder à mon espace →</button>
      </div>
      <div className="section">
        <div className="cin sec-title">Comment ça marche ?</div><div className="divider"/>
        <div className="steps">{steps.map(([n,t,d])=><div key={n} className="step"><div className="snum">{n}</div><div className="st">{t}</div><div className="sd">{d}</div></div>)}</div>
        <div style={{ textAlign:"center" }}><button className="btn btn-g" onClick={onRequestAuth}>Créer mon compte gratuit →</button></div>
      </div>
    </div>
  );
}

// ── ADMIN AUTH (vérifie le rôle 'admin' dans Supabase) ──────────────────────
function AdminAuth({ onLogin, onBack }) {
  const [f, setF] = useState({ email:"", pwd:"" });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      const user = await connecter(f.email, f.pwd);
      const { data: profil } = await supabase.from("profils").select("role").eq("id", user.id).single();
      if (profil?.role !== "admin") {
        await deconnecter();
        setErr("Ce compte n'a pas les droits administrateur.");
        setLoading(false);
        return;
      }
      onLogin(user);
    } catch (e) {
      setErr("Email ou mot de passe incorrect.");
    }
    setLoading(false);
  };
  return (
    <div className="auth-wrap" style={{ background:`linear-gradient(135deg,#08050f,${C.purpleD})` }}>
      <div className="auth-box">
        <div style={{ textAlign:"center", fontSize:40, marginBottom:12 }}>🛡️</div>
        <div className="auth-title">Panneau <span style={{ color:C.gold }}>Admin</span></div>
        <div className="auth-sub">Accès réservé — Kingdom Events</div>
        {err&&<div className="alert-e">{err}</div>}
        <div className="fg"><label className="fl2">Email</label><input className="fi" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="admin@kingdom.cm"/></div>
        <div className="fg"><label className="fl2">Mot de passe</label><input className="fi" type="password" value={f.pwd} onChange={e=>setF({...f,pwd:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="••••••••"/></div>
        <div style={{ fontSize:11, color:C.slateL, marginBottom:14, textAlign:"center" }}>Connexion avec votre compte Supabase ayant le rôle "admin"</div>
        <button className="btn-full" disabled={loading||!f.email||!f.pwd} onClick={submit}>{loading?"⏳ Vérification...":"Accéder au panneau admin"}</button>
        <div className="back-link" onClick={onBack}>← Retour au site</div>
      </div>
    </div>
  );
}

// ── PANNEAU ADMIN ─────────────────────────────────────────────────────────────
function AdminPanel({ events, orgs, onAction, onLogout, adminEmail }) {
  const [tab, setTab] = useState("events");
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");

  const filtered = events.filter(e =>
    e.titre?.toLowerCase().includes(q.toLowerCase()) ||
    (e.org||e.eglise||"").toLowerCase().includes(q.toLowerCase())
  );
  const badge = (s) => <span className={`badge badge-${s==="approuve"?"a":s==="rejete"?"r":"w"}`}>{s==="approuve"?"✅ Approuvé":s==="rejete"?"❌ Rejeté":"⏳ En attente"}</span>;
  const sc = (color,val,label) => <div className="scard" style={{"--c":color}}><div className="v">{val}</div><div className="k">{label}</div></div>;

  return (
    <div style={{ minHeight:"100vh", background:C.ivory }}>
      <div className="dash-head">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div className="dash-name" style={{ fontSize:16 }}>Kingdom Events</div>
          <span style={{ background:C.gold, color:C.purpleD, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>ADMIN</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>{adminEmail}</span>
          <button className="btn-logout" onClick={onLogout}>Déconnexion</button>
        </div>
      </div>

      <div className="admin-tabs">
        {[["events","📋 Événements"],["orgs","👤 Organisateurs"],["stats","📊 Statistiques"]].map(([k,l])=>(
          <button key={k} className={`atab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={{ padding:"24px 24px" }}>
        {tab==="events"&&(
          <>
            <div className="stat-cards">
              {sc(C.purple, events.length,"Total")}
              {sc("#B8860B", events.filter(e=>e.statut==="en_attente").length,"En attente")}
              {sc(C.green, events.filter(e=>e.statut==="approuve").length,"Approuvés")}
              {sc(C.red, events.filter(e=>e.statut==="rejete").length,"Rejetés")}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div className="cin" style={{ fontSize:15, fontWeight:700, color:C.purpleD }}>Gestion des événements</div>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Rechercher..." style={{ padding:"9px 14px", border:`1.5px solid ${C.ivoryD}`, borderRadius:8, fontSize:12, outline:"none", width:240 }}/>
            </div>
            {filtered.length===0
              ? <div style={{ textAlign:"center", padding:"60px 20px", color:C.slateL }}><div style={{ fontSize:44, marginBottom:12 }}>📭</div><div>Aucun événement soumis.</div><div style={{ fontSize:12, marginTop:6 }}>Les événements des organisateurs apparaîtront ici.</div></div>
              : <div style={{ overflowX:"auto" }}>
                  <table className="tbl">
                    <thead><tr>{["Titre","Église","Ville","Dates","Médias","Statut","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filtered.map(ev=>(
                        <tr key={ev.id}>
                          <td><div style={{ fontWeight:600, color:C.purpleD }}>{ev.titre}</div><div style={{ fontSize:10, color:C.slateL }}>{ev.type}</div></td>
                          <td>{ev.org||ev.eglise}</td>
                          <td>{ev.ville||"—"}</td>
                          <td><div style={{ fontSize:11 }}>📅 {ev.dateDebut||"—"}</div>{ev.dateFin&&ev.dateFin!==ev.dateDebut&&<div style={{ fontSize:10, color:C.slateL }}>→ {ev.dateFin}</div>}</td>
                          <td style={{ fontSize:12 }}>{(ev.photos?.length||0)>0&&`🖼️${ev.photos.length} `}{(ev.videos?.length||0)>0&&`🎬${ev.videos.length}`}{!ev.photos?.length&&!ev.videos?.length&&"—"}</td>
                          <td>{badge(ev.statut)}</td>
                          <td>
                            <button className="btn btn-p" style={{ fontSize:11, padding:"5px 10px", marginRight:4 }} onClick={()=>setSel(ev)}>Voir</button>
                            {ev.statut!=="approuve"&&<button className="btn" style={{ fontSize:11, padding:"5px 10px", marginRight:4, background:C.green, color:"#fff" }} onClick={()=>onAction(ev.id,"approuve")}>✓</button>}
                            {ev.statut!=="rejete"&&<button className="btn" style={{ fontSize:11, padding:"5px 10px", marginRight:4, background:"#E67E22", color:"#fff" }} onClick={()=>onAction(ev.id,"rejete")}>✗</button>}
                            <button className="btn btn-r" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>onAction(ev.id,"supprimer")}>🗑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </>
        )}

        {tab==="orgs"&&(
          <>
            <div className="cin" style={{ fontSize:15, fontWeight:700, color:C.purpleD, marginBottom:16 }}>Organisateurs ({orgs.length})</div>
            {orgs.length===0
              ? <div style={{ textAlign:"center", padding:"60px 20px", color:C.slateL }}><div style={{ fontSize:44 }}>👤</div><div style={{ marginTop:12 }}>Aucun organisateur inscrit.</div></div>
              : <table className="tbl">
                  <thead><tr>{["Église","Responsable","Email","Événements"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{orgs.map((o,i)=><tr key={i}><td style={{ fontWeight:600, color:C.purpleD }}>{o.eglise}</td><td>{o.nom||"—"}</td><td>{o.email}</td><td>{events.filter(e=>e.email===o.email).length}</td></tr>)}</tbody>
                </table>
            }
          </>
        )}

        {tab==="stats"&&(
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16 }}>
            {[["🎉",events.length,"Événements soumis",C.purple],["✅",events.filter(e=>e.statut==="approuve").length,"Approuvés",C.green],["⏳",events.filter(e=>e.statut==="en_attente").length,"En attente","#B8860B"],["👤",orgs.length,"Organisateurs",C.purpleL],["🖼️",events.reduce((a,e)=>a+(e.photos?.length||0),0),"Photos",C.gold],["🎬",events.reduce((a,e)=>a+(e.videos?.length||0),0),"Vidéos",C.slateL]].map(([ic,v,l,col])=>(
              <div key={l} style={{ background:"#fff", borderRadius:12, padding:"22px 18px", boxShadow:"0 2px 8px rgba(0,0,0,.06)", borderTop:`4px solid ${col}` }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{ic}</div>
                <div className="cin" style={{ fontSize:26, fontWeight:700, color:col }}>{v}</div>
                <div style={{ fontSize:11, color:C.slateL, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal détail */}
      {sel&&(
        <div className="overlay" onClick={()=>setSel(null)}>
          <div className="mbox" onClick={e=>e.stopPropagation()}>
            <button className="mclose" onClick={()=>setSel(null)}>✕</button>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:C.purpleL, textTransform:"uppercase", marginBottom:6 }}>{sel.type}</div>
            <div className="cin" style={{ fontSize:18, fontWeight:700, color:C.purpleD, marginBottom:4 }}>{sel.titre}</div>
            <div style={{ fontSize:12, color:C.slateL, marginBottom:16 }}>{sel.org||sel.eglise}</div>
            {badge(sel.statut)}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:18 }}>
              {[["📅 Début",`${sel.dateDebut||"—"} ${sel.heureDebut||""}`],["📅 Fin",`${sel.dateFin||"—"} ${sel.heureFin||""}`],["📍 Lieu",sel.lieu||"—"],["🏙️ Ville",sel.ville||"—"],["💰 Prix",sel.prix?`${sel.prix.toLocaleString()} FCFA`:"Gratuit"],["📧 Email",sel.email||"—"]].map(([k,v])=>(
                <div key={k} style={{ background:C.ivory, borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.slateL, textTransform:"uppercase", letterSpacing:1 }}>{k}</div>
                  <div style={{ fontSize:13, color:C.slate, marginTop:2, fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            {sel.desc&&<div style={{ marginTop:14, background:C.ivory, borderRadius:8, padding:12, fontSize:13, color:C.slate, lineHeight:1.65 }}>{sel.desc}</div>}
            {sel.photos?.length>0&&(
              <div style={{ marginTop:16 }}>
                <div className="cin" style={{ fontSize:12, fontWeight:700, color:C.purpleD, marginBottom:10 }}>🖼️ Photos ({sel.photos.length})</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {sel.photos.map((p,i)=><img key={i} src={p.url} alt={p.name} style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:8, border:`1px solid ${C.ivoryD}` }}/>)}
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:8, marginTop:20 }}>
              {sel.statut!=="approuve"&&<button className="btn-full" style={{ background:C.green }} onClick={()=>{onAction(sel.id,"approuve");setSel(null)}}>✅ Approuver</button>}
              {sel.statut!=="rejete"&&<button className="btn-full" style={{ background:"#E67E22" }} onClick={()=>{onAction(sel.id,"rejete");setSel(null)}}>❌ Rejeter</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]         = useState("home");
  const [user, setUser]         = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [admin, setAdmin]       = useState(false);
  const [showAdm, setShowAdm]   = useState(false);
  const [villeF, setVilleF]     = useState("Toutes");
  const [typeF, setTypeF]       = useState("Tous");
  const [selEv, setSelEv]       = useState(null);
  const [regEv, setRegEv]       = useState(null);
  const [evenements, setEvenements] = useState([]);   // événements publics approuvés
  const [adminEvents, setAdminEvents] = useState([]); // tous les événements (vue admin)
  const [chargement, setChargement] = useState(true);

  // ── Charge les événements publics au démarrage et à chaque changement de filtre ──
  useEffect(() => {
    getEvenementsApprouves({ ville: villeF, type: typeF })
      .then(data => setEvenements(data || []))
      .catch(err => console.error("Erreur chargement événements:", err))
      .finally(() => setChargement(false));
  }, [villeF, typeF]);

  // ── Vérifie si une session existe déjà (rechargement de page) ──────────────
  useEffect(() => {
    getUtilisateurConnecte().then(u => { if (u) setUser(u); });
    const unsub = ecouterSession((authUser) => {
      if (!authUser) setUser(null);
    });
    return unsub;
  }, []);

  // Adapte les données Supabase (organisateurs.nom_eglise, medias[]) au format attendu par <Card>/<Detail>
  const adapterEvenement = (e) => ({
    ...e,
    org: e.organisateurs?.nom_eglise,
    dateDebut: e.date_debut,
    dateFin: e.date_fin,
    heureDebut: e.heure_debut,
    heureFin: e.heure_fin,
    photos: (e.medias || []).filter(m => m.type === "photo"),
    videos: (e.medias || []).filter(m => m.type === "video"),
    emoji: "✝️", bg: C.purpleD,
  });

  const filtered = evenements.map(adapterEvenement);

  const handleSubmit = async () => {
    // Recharge la liste après soumission d'un nouvel événement
    const data = await getEvenementsApprouves({});
    setEvenements(data || []);
  };

  const chargerAdminEvents = async () => {
    try {
      const data = await getTousLesEvenements();
      setAdminEvents(data.map(adapterEvenement));
    } catch (e) { console.error(e); }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === "supprimer") await supprimerEvenement(id);
      else await changerStatutEvenement(id, action);
      await chargerAdminEvents();
    } catch (e) { alert("Erreur : " + e.message); }
  };

  const handleAdminLogin = async (u) => {
    setAdminUser(u);
    setAdmin(true);
    setShowAdm(false);
    await chargerAdminEvents();
  };

  const handleAdminLogout = async () => {
    await deconnecter();
    setAdmin(false);
    setAdminUser(null);
    setPage("home");
  };

  const handleOrgLogout = async () => {
    await deconnecter();
    setUser(null);
    setPage("home");
  };

  if (admin) return <><style>{G}</style><AdminPanel events={adminEvents} orgs={[]} onAction={handleAction} onLogout={handleAdminLogout} adminEmail={adminUser?.email}/></>;
  if (showAdm) return <><style>{G}</style><AdminAuth onLogin={handleAdminLogin} onBack={()=>setShowAdm(false)}/></>;
  if (showAuth) return <><style>{G}</style><OrgAuth onBack={()=>setShowAuth(false)} onLogin={async u=>{const full=await getUtilisateurConnecte();setUser(full||u);setShowAuth(false);setPage("org")}}/></>;

  return (
    <>
      <style>{G}</style>

      <nav>
        <div className="logo" onClick={()=>{setPage("home");setSelEv(null)}}>Kingdom <em>Events</em></div>
        <div className="nav-links">
          <button className={`nb ${page==="home"?"on":""}`} onClick={()=>{setPage("home");setSelEv(null)}}>Événements</button>
          <button className={`nb ${page==="churches"?"on":""}`} onClick={()=>setPage("churches")}>Églises</button>
          <button className={`nb ${page==="org"?"on":""}`} onClick={()=>setPage("org")}>Organisateurs</button>
          <button className="nb" style={{ opacity:.4, fontSize:11 }} onClick={()=>setShowAdm(true)}>Admin</button>
        </div>
        {user
          ? <button className="ncta" onClick={()=>setPage("org")}>Mon espace ✓</button>
          : <button className="ncta" onClick={()=>user?setPage("org"):setShowAuth(true)}>Publier un événement</button>
        }
      </nav>

      {page==="home"&&!selEv&&(
        <>
          <div className="hero">
            <h1>Tous les événements<br/><span>du Royaume de Dieu</span><br/>au Cameroun</h1>
            <p>Croisades, concerts gospel, séminaires, nuits de prière — découvrez et inscrivez-vous.</p>
            <div className="hbtns">
              <button className="btn btn-g">Voir les événements ↓</button>
              <button className="btn btn-o" onClick={()=>user?setPage("org"):setShowAuth(true)}>Je suis organisateur</button>
            </div>
            <div className="stats">
              {[["120+","Événements"],["48","Ministères"],["8","Villes"],["5 200","Inscrits"]].map(([n,l])=>(
                <div key={l} className="stat"><div className="n">{n}</div><div className="l">{l}</div></div>
              ))}
            </div>
          </div>

          <div className="filters">
            <span className="fl">Ville :</span>
            {VILLES.map(v=><button key={v} className={`chip ${villeF===v?"on":""}`} onClick={()=>setVilleF(v)}>{v}</button>)}
            <span className="fl" style={{ marginLeft:10 }}>Type :</span>
            {TYPES.map(t=><button key={t} className={`chip ${typeF===t?"on":""}`} onClick={()=>setTypeF(t)}>{t}</button>)}
          </div>

          <div className="section">
            <div className="cin sec-title">Prochains événements</div>
            <div className="sec-sub">{filtered.length} événement{filtered.length>1?"s":""} trouvé{filtered.length>1?"s":""}</div>
            <div className="divider"/>
            <div className="grid">
              {filtered.map(e=><Card key={e.id} ev={e} onClick={ev=>{setSelEv(ev);setPage("home")}}/>)}
            </div>
          </div>
        </>
      )}

      {page==="home"&&selEv&&(
        <Detail ev={selEv} onBack={()=>setSelEv(null)} onRegister={()=>setRegEv(selEv)}/>
      )}

      {page==="org"&&(
        <OrgPage user={user} onRequestAuth={()=>setShowAuth(true)} onLogout={handleOrgLogout} onSubmit={handleSubmit}/>
      )}

      {page==="churches"&&(
        <div>
          <div style={{ background:`linear-gradient(135deg,${C.purpleD},${C.purple})`, padding:"48px 24px", textAlign:"center" }}>
            <div className="cin" style={{ fontSize:"clamp(20px,4vw,34px)", fontWeight:900, color:"#fff", marginBottom:10 }}>Trouver une <span style={{ color:C.gold }}>Église</span></div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,.7)" }}>Communautés chrétiennes partenaires au Cameroun</div>
          </div>
          <div className="section">
            <div className="cin sec-title">Églises partenaires</div><div className="divider"/>
            <div className="grid">
              {[["Église Centrale du Réveil","Évangélique","Douala, Akwa",4],["Paroisse Saint-Pierre et Paul","Catholique","Yaoundé, Centre-ville",2],["New Life Church Cameroon","Pentecôtiste","Douala, Bonanjo",6],["Temple du Plein Évangile","Pentecôtiste","Yaoundé, Melen",5],["Baptist Church Douala","Baptiste","Douala, Deido",2],["EPC Bafoussam","Presbytérienne","Bafoussam",3]].map(([n,d,v,ev])=>(
                <div key={n} style={{ background:"#fff", borderRadius:12, padding:22, border:`1px solid ${C.ivoryD}`, cursor:"pointer", transition:".2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.purpleL} onMouseLeave={e=>e.currentTarget.style.borderColor=C.ivoryD}>
                  <div style={{ fontSize:32, marginBottom:10 }}>⛪</div>
                  <div className="cin" style={{ fontSize:14, fontWeight:700, color:C.purpleD, marginBottom:4 }}>{n}</div>
                  <div style={{ fontSize:11, color:C.purpleL, fontWeight:600, marginBottom:6 }}>{d}</div>
                  <div style={{ fontSize:12, color:C.slateL }}>📍 {v}</div>
                  <div style={{ marginTop:10, background:C.ivory, color:C.purple, fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:20, display:"inline-block" }}>{ev} événement{ev>1?"s":""} à venir</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {regEv&&<RegisterModal event={regEv} onClose={()=>setRegEv(null)}/>}

      <footer>
        <div className="ftop">
          <div>
            <div className="cin" style={{ color:C.gold, fontSize:16, fontWeight:700, marginBottom:10 }}>Kingdom Events Cameroun</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", lineHeight:1.7 }}>La plateforme de référence pour les événements chrétiens au Cameroun. Croisades, concerts gospel, séminaires — connectez-vous au Corps du Christ.</div>
          </div>
          <div>
            <div className="fl3">Explorer</div>
            <div className="flink" onClick={()=>{setPage("home");setSelEv(null)}}>Tous les événements</div>
            <div className="flink" onClick={()=>setPage("churches")}>Trouver une église</div>
            <div className="flink">Artistes gospel</div>
          </div>
          <div>
            <div className="fl3">Organisateurs</div>
            <div className="flink" onClick={()=>user?setPage("org"):setShowAuth(true)}>Publier un événement</div>
            <div className="flink">Tarifs & commissions</div>
            <div className="flink">Contact</div>
          </div>
        </div>
        <div className="fbot">© 2025 Kingdom Events Cameroun · Fait avec ✝️ à Douala · MTN & Orange Money</div>
      </footer>
    </>
  );
}
