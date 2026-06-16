import { supabase } from "./supabase";

// ── INSCRIPTION ORGANISATEUR ────────────────────────────────────────────────
export async function inscrireOrganisateur({ email, password, nom, prenom, nomEglise, ville, telephone }) {
  // 1. Crée le compte d'authentification
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nom, prenom } },
  });
  if (authError) throw authError;

  // 2. Met à jour le rôle en "organisateur" sur le profil (créé automatiquement par trigger)
  const userId = authData.user.id;
  await supabase.from("profils").update({ role: "organisateur", ville, telephone }).eq("id", userId);

  // 3. Crée la fiche organisateur (église / ministère)
  const { error: orgError } = await supabase.from("organisateurs").insert({
    profil_id: userId,
    nom_eglise: nomEglise,
    ville,
    telephone,
    statut: "en_attente",
  });
  if (orgError) throw orgError;

  return authData.user;
}

// ── CONNEXION ────────────────────────────────────────────────────────────────
export async function connecter(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// ── DÉCONNEXION ──────────────────────────────────────────────────────────────
export async function deconnecter() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── MOT DE PASSE OUBLIÉ ──────────────────────────────────────────────────────
// Envoie un email avec un lien de réinitialisation (géré nativement par Supabase)
export async function demanderReinitialisation(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset-password",
  });
  if (error) throw error;
}

// ── NOUVEAU MOT DE PASSE (après clic sur le lien email) ─────────────────────
export async function definirNouveauMotDePasse(nouveauPassword) {
  const { error } = await supabase.auth.updateUser({ password: nouveauPassword });
  if (error) throw error;
}

// ── RÉCUPÉRER L'UTILISATEUR CONNECTÉ + SON PROFIL ────────────────────────────
export async function getUtilisateurConnecte() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profil } = await supabase.from("profils").select("*").eq("id", user.id).single();
  const { data: organisateur } = await supabase
    .from("organisateurs")
    .select("*")
    .eq("profil_id", user.id)
    .maybeSingle();

  return { ...user, profil, organisateur };
}

// ── ÉCOUTER LES CHANGEMENTS DE SESSION (connexion/déconnexion en direct) ────
export function ecouterSession(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => listener.subscription.unsubscribe();
}
