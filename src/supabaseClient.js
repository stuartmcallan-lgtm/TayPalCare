import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const localDb = {
  async createSubmission(delegateName, payload) {
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        delegate_name: delegateName || null,
        payload: payload || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSubmission(id, updates) {
    const { error } = await supabase
      .from("submissions")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async getAllSubmissions() {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getCardsBySubmission(submissionId) {
    const { data, error } = await supabase
      .from("submission_cards")
      .select("*")
      .eq("submission_id", submissionId);
    if (error) throw error;
    return data || [];
  },

  async getAllCards() {
    const { data, error } = await supabase
      .from("submission_cards")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async upsertCard(card) {
    const { data: existing } = await supabase
      .from("submission_cards")
      .select("id")
      .eq("submission_id", card.submission_id)
      .eq("bridge_index", card.bridge_index)
      .eq("card_key", card.card_key)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("submission_cards")
        .update({
          celebration: card.celebration,
          improvement: card.improvement,
          transformation: card.transformation,
          connect: card.connect,
          allocation_reference: card.allocation_reference,
          narrative: card.narrative,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("submission_cards").insert(card);
      if (error) throw error;
    }
  },

  async insertCard(card) {
    const { error } = await supabase.from("submission_cards").insert(card);
    if (error) throw error;
  },

  subscribe(callback) {
    const channel = supabase
      .channel("submission_cards_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submission_cards" },
        callback
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
