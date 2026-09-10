// Local browser storage — replaces Supabase for all workshop data.
// Submissions and card rows are persisted in localStorage.

const SUBMISSIONS_KEY = "tayside-submissions";
const CARDS_KEY = "tayside-submission-cards";

function readSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeSubmissions(subs) {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));
}

function readCards() {
  try {
    return JSON.parse(localStorage.getItem(CARDS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCards(cards) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const listeners = new Set();

function notifyChange() {
  listeners.forEach((fn) => fn());
}

export const localDb = {
  createSubmission(delegateName, payload) {
    const subs = readSubmissions();
    const sub = {
      id: genId(),
      delegate_name: delegateName || null,
      submitted_at: new Date().toISOString(),
      payload: payload || {},
    };
    subs.push(sub);
    writeSubmissions(subs);
    notifyChange();
    return sub;
  },

  updateSubmission(id, updates) {
    const subs = readSubmissions();
    const idx = subs.findIndex((s) => s.id === id);
    if (idx >= 0) {
      subs[idx] = { ...subs[idx], ...updates };
      writeSubmissions(subs);
      notifyChange();
    }
  },

  getAllSubmissions() {
    return readSubmissions().sort((a, b) =>
      (b.submitted_at || "").localeCompare(a.submitted_at || "")
    );
  },

  getCardsBySubmission(submissionId) {
    return readCards().filter((c) => c.submission_id === submissionId);
  },

  getAllCards() {
    return readCards();
  },

  upsertCard(card) {
    const cards = readCards();
    const idx = cards.findIndex(
      (c) =>
        c.submission_id === card.submission_id &&
        c.bridge_index === card.bridge_index &&
        c.card_key === card.card_key
    );
    if (idx >= 0) {
      cards[idx] = { ...cards[idx], ...card, id: cards[idx].id };
    } else {
      cards.push({ ...card, id: genId() });
    }
    writeCards(cards);
    notifyChange();
  },

  insertCard(card) {
    const cards = readCards();
    cards.push({ ...card, id: genId() });
    writeCards(cards);
    notifyChange();
  },

  subscribe(callback) {
    listeners.add(callback);
    const handler = (e) => {
      if (e.key === SUBMISSIONS_KEY || e.key === CARDS_KEY) {
        callback();
      }
    };
    window.addEventListener("storage", handler);
    return () => {
      listeners.delete(callback);
      window.removeEventListener("storage", handler);
    };
  },
};
