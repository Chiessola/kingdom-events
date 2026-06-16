import { supabase } from "./supabase";

// ── RÉCUPÉRER TOUS LES ÉVÉNEMENTS APPROUVÉS (page publique) ─────────────────
export async function getEvenementsApprouves({ ville, type } = {}) {
  let query = supabase
    .from("evenements")
    .select(`
      *,
      organisateurs ( nom_eglise, ville ),
      medias ( id, type, url, est_couverture )
    `)
    .eq("statut", "approuve")
    .order("date_debut", { ascending: true });

  if (ville && ville !== "Toutes") query = query.eq("ville", ville);
  if (type && type !== "Tous") query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ── RÉCUPÉRER UN ÉVÉNEMENT PAR ID (page détail) ─────────────────────────────
export async function getEvenementParId(id) {
  const { data, error } = await supabase
    .from("evenements")
    .select(`*, organisateurs ( nom_eglise, ville, telephone ), medias ( id, type, url )`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ── CRÉER UN ÉVÉNEMENT (organisateur connecté) ──────────────────────────────
export async function creerEvenement(organisateurId, donnees) {
  const { data, error } = await supabase
    .from("evenements")
    .insert({
      organisateur_id: organisateurId,
      titre: donnees.titre,
      type: donnees.type,
      description: donnees.desc,
      lieu: donnees.lieu,
      ville: donnees.ville,
      date_debut: donnees.dateDebut,
      date_fin: donnees.dateFin || null,
      heure_debut: donnees.heureDebut || null,
      heure_fin: donnees.heureFin || null,
      prix: Number(donnees.prix) || 0,
      est_gratuit: Number(donnees.prix) === 0,
      statut: "en_attente",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── RÉCUPÉRER LES ÉVÉNEMENTS D'UN ORGANISATEUR (son dashboard) ─────────────
export async function getMesEvenements(organisateurId) {
  const { data, error } = await supabase
    .from("evenements")
    .select(`*, medias ( id, type, url )`)
    .eq("organisateur_id", organisateurId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ── ADMIN : récupérer TOUS les événements quel que soit le statut ──────────
export async function getTousLesEvenements() {
  const { data, error } = await supabase
    .from("evenements")
    .select(`*, organisateurs ( nom_eglise ), medias ( id, type, url )`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ── ADMIN : changer le statut d'un événement ────────────────────────────────
export async function changerStatutEvenement(id, statut) {
  const { error } = await supabase
    .from("evenements")
    .update({ statut, approuve_at: statut === "approuve" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

// ── SUPPRIMER UN ÉVÉNEMENT ───────────────────────────────────────────────────
export async function supprimerEvenement(id) {
  const { error } = await supabase.from("evenements").delete().eq("id", id);
  if (error) throw error;
}
