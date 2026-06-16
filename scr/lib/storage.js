import { supabase } from "./supabase";

const BUCKET = "evenements-medias"; // nom du bucket Storage (créé ci-dessous dans les instructions)

// ── UPLOAD UN FICHIER VERS SUPABASE STORAGE ─────────────────────────────────
export async function uploaderFichier(file, dossier = "general") {
  const extension = file.name.split(".").pop();
  const nomUnique = `${dossier}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(nomUnique, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  // Récupère l'URL publique permanente du fichier
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nomUnique);
  return data.publicUrl;
}

// ── UPLOAD PLUSIEURS FICHIERS + ENREGISTREMENT EN BASE ──────────────────────
export async function uploaderMediasEvenement(evenementId, fichiers, onProgress) {
  const resultats = [];
  const total = fichiers.length;

  for (let i = 0; i < fichiers.length; i++) {
    const f = fichiers[i];
    const url = await uploaderFichier(f.file, `evenement-${evenementId}`);

    const { error } = await supabase.from("medias").insert({
      evenement_id: evenementId,
      type: f.file.type.startsWith("image/") ? "photo" : "video",
      url,
      nom_fichier: f.name,
      taille_mo: parseFloat(f.mb),
    });
    if (error) throw error;

    resultats.push({ name: f.name, url });
    if (onProgress) onProgress(Math.round(((i + 1) / total) * 100));
  }

  return resultats;
}

// ── SUPPRIMER UN FICHIER DU STORAGE ──────────────────────────────────────────
export async function supprimerFichier(cheminFichier) {
  const { error } = await supabase.storage.from(BUCKET).remove([cheminFichier]);
  if (error) throw error;
}
