import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";

const tokenTypes = [
  { id: "celebration", label: "Celebration", short: "Green", limit: 5, color: "green", description: "Protect what is working and build on strengths." },
  { id: "improvement", label: "Improvement", short: "Amber", limit: 10, color: "amber", description: "Deliver better experiences for people and families." },
  { id: "transformation", label: "Transformation", short: "Gold", limit: 3, color: "gold", description: "Collective effort over the next 18 months." },
  { id: "connect", label: "Connect Better", short: "Silver", limit: 2, color: "silver", description: "Improve connection, communication, or coordination." },
];

const cardMeta = [
  { key: "A", label: "What is happening?", focus: "Clinical & personal context" },
  { key: "B", label: "What matters most?", focus: "Personal priorities" },
  { key: "C", label: "How services help", focus: "Team roles & support" },
  { key: "D", label: "Connect better & guardrails", focus: "Transitions & pitfalls" },
];

const bridges = [
  { title: "Significant Diagnosis / Life-Changing News", intro: "A person receives information that may fundamentally change how they see their future.", context: ["Cancer diagnosis", "Progressive neurological disease", "Advanced organ failure", "Serious frailty or dementia", "Recurrence of illness"], matters: ["What does this mean?", "Can this be treated?", "Who will support me?", "How do I tell my family?"], quote: "Everything changed that day.", transition: "Living well → Significant diagnosis / life-changing news", guardrails: ["Diagnosis without support", "Information overload", "Unclear next steps", "Family not supported"], services: [{ name: "General Practice", items: ["Trusted follow-up", "Continuity beyond diagnosis"] }, { name: "Specialist Palliative Care", items: ["Explain progression", "Introduce support pathways"] }, { name: "Community Nursing", items: ["Reassurance and navigation", "Support at home"] }, { name: "Third Sector", items: ["Practical support", "Family resources"] }] },
  { title: "Understanding & Adapting", intro: "People are beginning to understand the implications of their diagnosis or changing health.", context: ["Progression of heart failure", "Advanced COPD", "Neurological disease diagnosis", "Recurrent hospital admissions", "Increasing frailty"], matters: ["I don't know what happens next.", "There is too much to process.", "I am terrified of tomorrow.", "I can't find the right help."], quote: "This isn't just happening to me — our family's journey is starting here too.", transition: "Significant diagnosis / life-changing news → Understanding & adapting", guardrails: ["Isolation", "Poor access to information", "Emotional distress unrecognised", "Support starts too late"], services: [{ name: "Hospital & Consultant Teams", items: ["Explain risks and options", "Signpost further support"] }, { name: "General Practice", items: ["Holistic review", "Support family members"] }, { name: "Community Nursing", items: ["Home-based assessment", "Monitor changing needs"] }, { name: "Allied Health Professionals", items: ["Functional assessment", "Communication and energy support"] }] },
  { title: "Planning Ahead", intro: "The focus shifts from treatment alone to planning for living well and future needs.", context: ["Future wishes", "Advance care planning", "Preferred place of care", "Personal goals", "Decision making"], matters: ["I want to choose my path.", "I need to stay in control.", "Please just listen to my voice.", "Help me make sense of things."], quote: "We need to plan for tomorrow.", transition: "Understanding & adapting → Planning ahead", guardrails: ["Delayed conversations", "Wishes not explored", "Carers excluded", "No advance care plan", "Lack of confidence"], services: [{ name: "General Practice", items: ["Anticipatory care planning", "Coordination"] }, { name: "Community Nursing", items: ["Ongoing support", "Discuss preferences"] }, { name: "Social Work & Social Care", items: ["Assess care needs", "Support planning"] }, { name: "Specialist Palliative Care", items: ["Complex planning", "Values-based decisions"] }] },
  { title: "Living with Illness", intro: "The impact of illness increases. Carers often begin providing increasing levels of support.", context: ["Fatigue", "Pain", "Breathlessness", "Reduced mobility", "More healthcare contacts"], matters: ["Please make the pain stop.", "I need help without the wait.", "I want to manage on my own.", "My carer needs help as well."], quote: "I just want to feel safe and feel normal.", transition: "Planning ahead → Living with illness", guardrails: ["Plans not shared", "Duplicate assessments", "Poor communication between services", "Unclear coordination"], services: [{ name: "General Practice", items: ["Ongoing management", "Medication review"] }, { name: "Community Nursing", items: ["Home visits", "Monitor symptoms"] }, { name: "Social Care", items: ["Care packages", "Personal care support"] }, { name: "Specialist Palliative Care", items: ["Complex symptom support", "Advice and education"] }] },
  { title: "Deterioration & Changing Needs", intro: "The illness progresses significantly. Families often become increasingly concerned and exhausted.", context: ["Rapid deterioration", "Recurrent crises", "Loss of independence", "Increasing dependency", "Carer exhaustion"], matters: ["I know exactly who to call.", "Help arrives when I need it.", "We can stop things getting worse.", "Everyone works together for my care."], quote: "We are tired, but staying strong together.", transition: "Planning ahead → Deterioration & changing needs", guardrails: ["Delayed response", "Crisis admissions", "Overwhelmed carers", "Lack of coordination"], services: [{ name: "General Practice", items: ["Clinical leadership", "Escalation decisions"] }, { name: "Community Nursing", items: ["Increased clinical support", "Monitor changes"] }, { name: "Acute Hospital Services", items: ["Acute treatment", "Stabilisation"] }, { name: "Specialist Palliative Care", items: ["Manage complexity", "Crisis advice"] }] },
  { title: "Care Around Dying", intro: "Healthcare teams recognise that a person may be entering the final days, weeks or short period of life.", context: ["Comfort", "Dignity", "Symptom management", "Family support", "Personal wishes"], matters: ["I am peaceful, comfortable, and pain-free.", "We feel truly cared for here.", "I am right where I want to be.", "Having my family near means everything."], quote: "I am treated with absolute dignity.", transition: "Deterioration & changing needs → Care around dying", guardrails: ["Late recognition of dying", "Wishes misunderstood", "Unnecessary interventions", "Poor family communication", "Services not aligned"], services: [{ name: "General Practice", items: ["Clinical oversight", "Anticipatory medication"] }, { name: "Community Nursing", items: ["End-of-life care", "Family support"] }, { name: "Specialist Palliative Care", items: ["Complex symptom control", "Advice and support"] }, { name: "Families & Spiritual Care", items: ["Presence and advocacy", "Emotional support"] }] },
  { title: "Death & Immediate Loss", intro: "The person dies and the focus shifts from caring for them to supporting those important to them.", context: ["Verification and certification", "Immediate loss", "Practical arrangements", "Support for loved ones"], matters: ["I feel treated with genuine respect.", "Clear guidance points us forward.", "Honest, plain facts give us clarity."], quote: "We are supported as we process this moment.", transition: "Care around dying → Death & immediate loss", guardrails: ["Families unprepared", "Practical arrangements unclear", "Poor communication at death", "Emotional support unavailable"], services: [{ name: "Nursing & Medical Staff", items: ["Immediate support", "Verification and certification"] }, { name: "Care Homes", items: ["Family support", "Practical guidance"] }, { name: "Bereavement Services", items: ["Information packs", "Early guidance"] }, { name: "Funeral Services", items: ["Practical arrangements"] }] },
  { title: "Bereavement & Living Beyond Loss", intro: "Family, friends and carers begin adjusting to life after loss. Grief can unfold over months or years.", context: ["Adjusting to loss", "Non-linear grief", "Emotional and physical impact", "Social or financial challenges", "Long-term effects"], matters: ["Their memory will live on with us.", "We still need someone to talk to.", "We know where to get support.", "Staying connected stops us feeling alone."], quote: "How we find a way forward after loss.", transition: "Death & immediate loss → Bereavement & living beyond loss", guardrails: ["Abandonment", "Support services unknown", "Complicated grief unrecognised", "Carers lose connection"], services: [{ name: "Bereavement Services", items: ["Information and support", "Counselling and peer support"] }, { name: "General Practice", items: ["Monitor wellbeing", "Identify complicated grief"] }, { name: "Community Groups", items: ["Social connection", "Community engagement"] }, { name: "Faith Groups", items: ["Spiritual support", "Ongoing connection"] }] },
];

const cardKeys = ["A", "B", "C", "D"];
const emptyTokens = () => ({ celebration: 0, improvement: 0, transformation: 0, connect: 0 });
const emptyCard = () => ({ tokens: emptyTokens(), narrative: "" });
const emptyResponses = () => bridges.reduce((acc, _, index) => ({ ...acc, [index]: { cards: { A: emptyCard(), B: emptyCard(), C: emptyCard(), D: emptyCard() }, saved: false } }), {});

function saveXlsx(rows, filename, sheetName) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = rows[0].map((_, i) => {
    const maxLen = Math.max(...rows.map((r) => String(r[i] ?? "").length));
    return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
  XLSX.writeFile(wb, filename);
}

function App() {
  const [mode, setMode] = useState("delegate");
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">TT</div><div><span>TAYSIDE TOGETHER</span><strong>Palliative Care Matters</strong></div></div>
        <div className="topbar-title">Workshop facilitation tool</div>
        <div className="mode-switch">
          <button className={mode === "delegate" ? "active" : ""} onClick={() => setMode("delegate")}>Delegate</button>
          <button className={mode === "facilitator" ? "active" : ""} onClick={() => setMode("facilitator")}>Facilitator</button>
        </div>
      </header>
      {mode === "delegate" ? <DelegateView /> : <FacilitatorView />}
    </div>
  );
}

function DelegateView() {
  const [activeBridge, setActiveBridge] = useState(0);
  const [responses, setResponses] = useState(emptyResponses);
  const [notice, setNotice] = useState("");
  const [delegateName, setDelegateName] = useState("");
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  const [submissionId, setSubmissionId] = useState(null);
  const isReview = activeBridge === bridges.length;

  const totals = useMemo(() => {
    const t = emptyTokens();
    bridges.forEach((_, b) => cardKeys.forEach((k) => {
      const tk = responses[b].cards[k].tokens;
      tokenTypes.forEach((ty) => { t[ty.id] += tk[ty.id]; });
    }));
    return t;
  }, [responses]);
  const totalSpent = Object.values(totals).reduce((sum, v) => sum + v, 0);
  const bridgeTokenCount = (b) => cardKeys.reduce((sum, k) => sum + Object.values(responses[b].cards[k].tokens).reduce((s, v) => s + v, 0), 0);

  const updateToken = (cardKey, typeId, direction) => {
    const card = responses[activeBridge].cards[cardKey];
    const current = card.tokens[typeId];
    const next = current + direction;
    if (next < 0) return;
    const type = tokenTypes.find((t) => t.id === typeId);
    const globalSpent = totals[typeId] - current;
    if (globalSpent + next > type.limit) {
      setNotice(`You have used all ${type.limit} ${type.short} tokens.`);
      return;
    }
    setNotice("");
    setResponses((r) => ({
      ...r,
      [activeBridge]: {
        ...r[activeBridge],
        saved: false,
        cards: { ...r[activeBridge].cards, [cardKey]: { ...r[activeBridge].cards[cardKey], tokens: { ...r[activeBridge].cards[cardKey].tokens, [typeId]: next } } },
      },
    }));
  };

  const updateNarrative = (cardKey, value) => setResponses((r) => ({
    ...r,
    [activeBridge]: {
      ...r[activeBridge],
      saved: false,
      cards: { ...r[activeBridge].cards, [cardKey]: { ...r[activeBridge].cards[cardKey], narrative: value } },
    },
  }));

  const saveAndContinue = async () => {
    const bridgeResp = responses[activeBridge];
    for (const k of cardKeys) {
      const card = bridgeResp.cards[k];
      if (Object.values(card.tokens).some(Boolean) && !card.narrative.trim()) {
        const meta = cardMeta.find((c) => c.key === k);
        setNotice(`Add a narrative for Card ${k} (${meta.label}) before saving.`);
        return;
      }
    }

    try {
      const payload = {};
      cardKeys.forEach((k) => { payload[k] = responses[activeBridge].cards[k]; });

      if (!submissionId) {
        const { data: sub, error: subError } = await supabase
          .from("submissions")
          .insert({ delegate_name: delegateName.trim() || null, payload })
          .select("id")
          .single();
        if (subError) throw subError;
        setSubmissionId(sub.id);

        const cardRows = cardKeys.map((k) => {
          const card = responses[activeBridge].cards[k];
          return {
            submission_id: sub.id,
            bridge_index: activeBridge,
            card_key: k,
            celebration: card.tokens.celebration,
            improvement: card.tokens.improvement,
            transformation: card.tokens.transformation,
            connect: card.tokens.connect,
            narrative: card.narrative,
          };
        });
        const { error: cardsError } = await supabase.from("submission_cards").insert(cardRows);
        if (cardsError) throw cardsError;
      } else {
        const { data: existing } = await supabase
          .from("submission_cards")
          .select("id, card_key")
          .eq("submission_id", submissionId)
          .eq("bridge_index", activeBridge);

        for (const k of cardKeys) {
          const card = responses[activeBridge].cards[k];
          const existingRow = existing?.find((r) => r.card_key === k);
          if (existingRow) {
            const { error: upErr } = await supabase.from("submission_cards").update({
              celebration: card.tokens.celebration,
              improvement: card.tokens.improvement,
              transformation: card.tokens.transformation,
              connect: card.tokens.connect,
              narrative: card.narrative,
            }).eq("id", existingRow.id);
            if (upErr) throw upErr;
          } else {
            const { error: insErr } = await supabase.from("submission_cards").insert({
              submission_id: submissionId,
              bridge_index: activeBridge,
              card_key: k,
              celebration: card.tokens.celebration,
              improvement: card.tokens.improvement,
              transformation: card.tokens.transformation,
              connect: card.tokens.connect,
              narrative: card.narrative,
            });
            if (insErr) throw insErr;
          }
        }

        const fullPayload = {};
        cardKeys.forEach((k) => { fullPayload[k] = responses[activeBridge].cards[k]; });
        await supabase.from("submissions").update({ payload: fullPayload }).eq("id", submissionId);
      }

      setResponses((r) => ({ ...r, [activeBridge]: { ...r[activeBridge], saved: true } }));
      setNotice("Saved to database.");
      setTimeout(() => setNotice(""), 2000);
      setActiveBridge((c) => Math.min(c + 1, bridges.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setNotice("Could not save. Please try again.");
    }
  };

  const downloadXlsx = () => {
    const rows = [["Bridge", "Card", "Card Focus", "Celebration", "Improvement", "Transformation", "Connect Better", "Total", "Narrative"]];
    bridges.forEach((bridge, b) => cardKeys.forEach((k) => {
      const card = responses[b].cards[k];
      const meta = cardMeta.find((c) => c.key === k);
      const total = Object.values(card.tokens).reduce((s, v) => s + v, 0);
      rows.push([`Bridge ${b + 1}: ${bridge.title}`, `Card ${k}`, meta.label, ...tokenTypes.map((t) => card.tokens[t.id]), total, card.narrative.replaceAll("\n", " ")]);
    }));
    saveXlsx(rows, "tayside-together-workshop.xlsx", "My Responses");
  };
  const printReport = () => window.print();

  const submitWorkshop = async () => {
    if (totalSpent === 0) {
      setSubmitState({ status: "error", message: "Allocate at least one token before submitting." });
      return;
    }
    setSubmitState({ status: "submitting", message: "" });
    try {
      if (delegateName.trim() && submissionId) {
        await supabase.from("submissions").update({ delegate_name: delegateName.trim() }).eq("id", submissionId);
      }
      setSubmitState({ status: "success", message: "Your responses have been submitted. Thank you!" });
    } catch (err) {
      setSubmitState({ status: "error", message: "Could not submit. Please try again." });
    }
  };

  return <>
    <section className="token-bar">
      <div className="token-intro"><span className="eyebrow">YOUR TOKEN BUDGET</span><strong>{20 - totalSpent}<small> / 20 remaining</small></strong></div>
      <div className="token-counters">{tokenTypes.map((type) => <div className={`token-counter ${type.color}`} key={type.id}><div className="token-counter-top"><span className="token-dot"/><strong>{type.short}</strong><b>{totals[type.id]} / {type.limit}</b></div><div className="meter"><span style={{ width: `${(totals[type.id] / type.limit) * 100}%` }}/></div></div>)}</div>
    </section>
    <main className="content">
      <nav className="stepper" aria-label="Palliative care journey stages">{bridges.map((bridge, index) => <button key={bridge.title} className={`step ${index === activeBridge ? "active" : ""} ${responses[index].saved ? "complete" : ""}`} onClick={() => setActiveBridge(index)}><span className="step-number">{responses[index].saved ? "✓" : index + 1}</span><span className="step-label">{bridge.title}</span></button>)}<button className={`step review-step ${isReview ? "active" : ""}`} onClick={() => setActiveBridge(bridges.length)}><span className="step-number">↗</span><span className="step-label">Review & submit</span></button></nav>
      {isReview ? <Review totals={totals} totalSpent={totalSpent} responses={responses} onXlsx={downloadXlsx} onPrint={printReport} delegateName={delegateName} setDelegateName={setDelegateName} submitState={submitState} onSubmit={submitWorkshop} /> : <BridgeView bridge={bridges[activeBridge]} index={activeBridge} response={responses[activeBridge]} onToken={updateToken} onNarrative={updateNarrative} onSave={saveAndContinue} notice={notice} bridgeTokenCount={bridgeTokenCount(activeBridge)} />}
    </main>
  </>;
}

function MiniToken({ type, count, onAdd, onRemove }) {
  return (
    <div className={`mini-token ${type.color}`}>
      <span className="token-dot" />
      <strong>{type.short}</strong>
      <div className="mini-stepper">
        <button onClick={onRemove} aria-label={`Remove ${type.label} token`} disabled={count === 0}>−</button>
        <b>{count}</b>
        <button onClick={onAdd} aria-label={`Add ${type.label} token`}>+</button>
      </div>
    </div>
  );
}

function CardAllocation({ cardKey, card, onToken, onNarrative }) {
  const hasTokens = Object.values(card.tokens).some(Boolean);
  const meta = cardMeta.find((c) => c.key === cardKey);
  return (
    <div className="card-allocation">
      <div className="card-alloc-head"><span className="eyebrow">ALLOCATE TO CARD {cardKey}</span><small>{meta.focus}</small></div>
      <div className="mini-alloc-row">
        {tokenTypes.map((type) => <MiniToken key={type.id} type={type} count={card.tokens[type.id]} onAdd={() => onToken(cardKey, type.id, 1)} onRemove={() => onToken(cardKey, type.id, -1)} />)}
      </div>
      <textarea className="card-narrative" value={card.narrative} onChange={(e) => onNarrative(cardKey, e.target.value)} placeholder={hasTokens ? `Why invest here? (required to save) ${meta.label.toLowerCase()}` : `Optional note for this card · ${meta.label.toLowerCase()}`} />
    </div>
  );
}

function BridgeView({ bridge, index, response, onToken, onNarrative, onSave, notice, bridgeTokenCount }) {
  return <>
    <section className="hero"><div className="hero-kicker">THE PALLIATIVE CARE JOURNEY <span>·</span> STAGE {String(index + 1).padStart(2, "0")}</div><h1>Bridge {index + 1} <span>—</span> {bridge.title}</h1><p>{bridge.intro}</p></section>
    <section className="bridge-grid">
      <article className="card happening">
        <div className="card-label"><span className="label-icon">01</span><div><small>CARD A</small><h2>What is happening?</h2></div></div>
        <p>{bridge.intro}</p><h3>People may experience</h3><ul>{bridge.context.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="context-note">A moment that can change the shape of everyday life.</div>
        <CardAllocation cardKey="A" card={response.cards.A} onToken={onToken} onNarrative={onNarrative} />
      </article>
      <article className="card matters">
        <div className="card-label"><span className="label-icon">02</span><div><small>CARD B</small><h2>What matters most?</h2></div></div>
        <div className="quote-mark">"</div><blockquote>{bridge.quote}</blockquote><div className="matter-list">{bridge.matters.map((item) => <span key={item}>{item}</span>)}</div>
        <CardAllocation cardKey="B" card={response.cards.B} onToken={onToken} onNarrative={onNarrative} />
      </article>
      <article className="card services">
        <div className="card-label"><span className="label-icon">03</span><div><small>CARD C</small><h2>How services help</h2></div></div>
        <div className="service-list">{bridge.services.map((service) => <div className="service-row" key={service.name}><strong>{service.name}</strong><ul>{service.items.map((item) => <li key={item}>{item}</li>)}</ul></div>)}</div>
        <CardAllocation cardKey="C" card={response.cards.C} onToken={onToken} onNarrative={onNarrative} />
      </article>
      <article className="card guardrails">
        <div className="card-label"><span className="label-icon">04</span><div><small>CARD D</small><h2>Connect better & guardrails</h2></div></div>
        <div className="transition"><span>CONNECT BETTER</span><strong>{bridge.transition}</strong></div><h3>What to avoid</h3><div className="guardrail-list">{bridge.guardrails.map((item) => <span key={item}>{item}</span>)}</div>
        <CardAllocation cardKey="D" card={response.cards.D} onToken={onToken} onNarrative={onNarrative} />
      </article>
    </section>
    {notice && <div className="notice" role="alert">{notice}</div>}
    <div className="action-row">
      <span>{bridgeTokenCount} tokens on this bridge · {response.saved ? "Saved — revisit any time." : "Unsaved changes"}</span>
      <button className="primary-button" onClick={onSave}>{index === bridges.length - 1 ? "Save & review" : "Save & continue"}<span>→</span></button>
    </div>
  </>;
}

function Review({ totals, totalSpent, responses, onXlsx, onPrint, delegateName, setDelegateName, submitState, onSubmit }) {
  const narratives = bridges.reduce((sum, _, b) => sum + cardKeys.filter((k) => responses[b].cards[k].narrative.trim()).length, 0);
  return <section className="review-page">
    <div className="hero"><div className="hero-kicker">WORKSHOP CLOSE</div><h1>Review <span>—</span> your collective priorities</h1><p>Review your investment across the whole journey, then submit your responses to the facilitator and export a shareable record.</p></div>
    <div className="review-summary"><div><span className="eyebrow">TOTAL ALLOCATED</span><strong>{totalSpent}<small> / 20 tokens</small></strong><p>{20 - totalSpent} tokens remain unallocated.</p></div><div className="summary-bars">{tokenTypes.map((type) => <div className="summary-bar" key={type.id}><div><span className={`token-dot ${type.color}`} /><strong>{type.label}</strong><b>{totals[type.id]} / {type.limit}</b></div><div className="meter"><span className={type.color} style={{ width: `${(totals[type.id] / type.limit) * 100}%` }} /></div></div>)}</div></div>
    <div className="review-table-wrap"><div className="section-heading"><div><span className="eyebrow">FULL JOURNEY</span><h2>Bridge-by-bridge, card-by-card</h2></div><span className="review-count">{narratives} narratives captured</span></div>
      <div className="review-table">
        <div className="table-row table-head"><span>Bridge & card</span>{tokenTypes.map((type) => <span key={type.id}>{type.short}</span>)}<span>Total</span><span>Narrative</span></div>
        {bridges.map((bridge, b) => {
          const filled = cardKeys.map((k) => ({ k, card: responses[b].cards[k], meta: cardMeta.find((c) => c.key === k) })).filter(({ card }) => Object.values(card.tokens).some(Boolean) || card.narrative.trim());
          if (filled.length === 0) return <div className="table-row empty-row" key={b}><span className="bridge-cell"><b>{b + 1}</b>{bridge.title}</span><span className="narrative-cell muted">No tokens allocated on this bridge</span></div>;
          return filled.map(({ k, card, meta }) => {
            const total = Object.values(card.tokens).reduce((s, v) => s + v, 0);
            return <div className="table-row" key={`${b}-${k}`}><span className="bridge-cell"><b>{b + 1}</b>{bridge.title}<em className="card-tag">Card {k} · {meta.label}</em></span>{tokenTypes.map((type) => <span className={type.color} key={type.id}>{card.tokens[type.id]}</span>)}<span className="total-cell">{total}</span><span className="narrative-cell">{card.narrative || "—"}</span></div>;
          });
        })}
      </div>
    </div>
    <div className="submit-card">
      <div className="section-heading"><div><span className="eyebrow">SUBMIT TO FACILITATOR</span><h2>Send your responses</h2></div></div>
      <p className="submit-desc">Your token allocations and narratives have been saved to the database as you progressed. Submit to confirm your responses.</p>
      <label className="name-label">Your name (optional)<input type="text" value={delegateName} onChange={(e) => setDelegateName(e.target.value)} placeholder="e.g. Dr Jane Smith" /></label>
      {submitState.status === "error" && <div className="notice" role="alert">{submitState.message}</div>}
      {submitState.status === "success" && <div className="success-notice" role="status">{submitState.message}</div>}
      <button className="primary-button submit-btn" onClick={onSubmit} disabled={submitState.status === "submitting" || submitState.status === "success"}>{submitState.status === "submitting" ? "Submitting..." : submitState.status === "success" ? "Submitted ✓" : "Submit responses"}<span>→</span></button>
    </div>
    <div className="export-card"><div><span className="eyebrow">READY TO SHARE</span><h2>Take the conversation with you</h2><p>Export all eight stages, every card's token choices, and narrative suggestions in a structured Excel report.</p></div><div className="export-actions"><button className="secondary-button" onClick={onXlsx}>Download Excel <span>↓</span></button><button className="primary-button" onClick={onPrint}>Download PDF report <span>↓</span></button></div></div>
  </section>;
}

function FacilitatorView() {
  const [submissions, setSubmissions] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [livePulse, setLivePulse] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const { data: subs, error: subError } = await supabase.from("submissions").select("id, delegate_name, submitted_at").order("submitted_at", { ascending: false });
        if (subError) throw subError;
        const { data: cardRows, error: cardError } = await supabase.from("submission_cards").select("id, submission_id, bridge_index, card_key, celebration, improvement, transformation, connect, narrative");
        if (cardError) throw cardError;
        if (cancelled) return;
        setSubmissions(subs || []);
        setCards(cardRows || []);
      } catch (err) {
        if (!cancelled) setError("Could not load results. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    const channel = supabase
      .channel("submission_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "submission_cards" }, (payload) => {
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1500);
        if (payload.eventType === "INSERT" && payload.new) {
          setCards((prev) => prev.some((c) => c.id === payload.new.id) ? prev : [...prev, payload.new]);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          setCards((prev) => prev.map((c) => (c.id === payload.new.id ? payload.new : c)));
        } else if (payload.eventType === "DELETE" && payload.old) {
          setCards((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, (payload) => {
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1500);
        if (payload.eventType === "INSERT" && payload.new) {
          setSubmissions((prev) => prev.some((s) => s.id === payload.new.id) ? prev : [payload.new, ...prev]);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          setSubmissions((prev) => prev.map((s) => (s.id === payload.new.id ? payload.new : s)));
        } else if (payload.eventType === "DELETE" && payload.old) {
          setSubmissions((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const aggregate = useMemo(() => {
    const byType = emptyTokens();
    const byBridgeCard = {};
    cards.forEach((c) => {
      byType.celebration += c.celebration;
      byType.improvement += c.improvement;
      byType.transformation += c.transformation;
      byType.connect += c.connect;
      const key = `${c.bridge_index}-${c.card_key}`;
      if (!byBridgeCard[key]) byBridgeCard[key] = { celebration: 0, improvement: 0, transformation: 0, connect: 0, narratives: [] };
      byBridgeCard[key].celebration += c.celebration;
      byBridgeCard[key].improvement += c.improvement;
      byBridgeCard[key].transformation += c.transformation;
      byBridgeCard[key].connect += c.connect;
      if (c.narrative && c.narrative.trim()) byBridgeCard[key].narratives.push({ narrative: c.narrative, delegate: submissions.find((s) => s.id === c.submission_id)?.delegate_name });
    });
    return { byType, byBridgeCard };
  }, [cards, submissions]);

  const totalTokens = Object.values(aggregate.byType).reduce((s, v) => s + v, 0);

  const downloadAggregateXlsx = () => {
    const rows = [["Bridge", "Card", "Card Focus", "Celebration", "Improvement", "Transformation", "Connect Better", "Total", "Narratives"]];
    bridges.forEach((bridge, b) => cardKeys.forEach((k) => {
      const meta = cardMeta.find((c) => c.key === k);
      const agg = aggregate.byBridgeCard[`${b}-${k}`] || { celebration: 0, improvement: 0, transformation: 0, connect: 0, narratives: [] };
      const total = agg.celebration + agg.improvement + agg.transformation + agg.connect;
      const narText = agg.narratives.map((n) => `${n.delegate || "Anonymous"}: ${n.narrative}`).join(" | ").replaceAll("\n", " ");
      rows.push([`Bridge ${b + 1}: ${bridge.title}`, `Card ${k}`, meta.label, agg.celebration, agg.improvement, agg.transformation, agg.connect, total, narText]);
    }));
    saveXlsx(rows, "tayside-together-aggregate.xlsx", "Aggregate Results");
  };

  const downloadIndividualXlsx = () => {
    const rows = [["Delegate", "Bridge", "Card", "Card Focus", "Celebration", "Improvement", "Transformation", "Connect Better", "Total", "Narrative"]];
    cards.forEach((c) => {
      const sub = submissions.find((s) => s.id === c.submission_id);
      const meta = cardMeta.find((m) => m.key === c.card_key);
      const bridge = bridges[c.bridge_index];
      const total = c.celebration + c.improvement + c.transformation + c.connect;
      rows.push([
        sub?.delegate_name || "Anonymous",
        `Bridge ${c.bridge_index + 1}: ${bridge?.title || ""}`,
        `Card ${c.card_key}`,
        meta?.label || "",
        c.celebration, c.improvement, c.transformation, c.connect, total,
        (c.narrative || "").replaceAll("\n", " "),
      ]);
    });
    saveXlsx(rows, "tayside-together-individual.xlsx", "Individual Responses");
  };

  if (loading) return <main className="content"><div className="facilitator-loading">Loading results...</div></main>;
  if (error) return <main className="content"><div className="facilitator-loading">{error}</div></main>;
  if (submissions.length === 0) return <main className="content"><section className="hero"><div className="hero-kicker">FACILITATOR VIEW</div><h1>No submissions yet</h1><p>Once delegates save their responses, you'll see everyone's tokens combined here. The view updates live as submissions arrive.</p><div className="live-badge"><span className="live-dot" /> Live monitoring active</div></section></main>;

  return <main className="content">
    <section className="hero"><div className="hero-kicker">FACILITATOR VIEW</div><h1>Aggregate results <span>—</span> all delegates</h1><p>{submissions.length} {submissions.length === 1 ? "delegate has" : "delegates have"} submitted, with {totalTokens} tokens allocated across the journey.</p></section>
    <div className={`live-badge ${livePulse ? "pulse" : ""}`}><span className="live-dot" /> {livePulse ? "Live update received" : "Live monitoring active"}</div>
    <div className="review-summary">
      <div><span className="eyebrow">TOTAL TOKENS</span><strong>{totalTokens}</strong><p>Across all {submissions.length} submissions</p></div>
      <div className="summary-bars">{tokenTypes.map((type) => <div className="summary-bar" key={type.id}><div><span className={`token-dot ${type.color}`} /><strong>{type.label}</strong><b>{aggregate.byType[type.id]}</b></div><div className="meter"><span className={type.color} style={{ width: `${aggregate.byType[type.id] > 0 ? Math.min((aggregate.byType[type.id] / (type.limit * submissions.length)) * 100, 100) : 0}%` }} /></div></div>)}</div>
    </div>
    <div className="review-table-wrap"><div className="section-heading"><div><span className="eyebrow">FULL JOURNEY</span><h2>Combined bridge-by-bridge results</h2></div><div className="export-actions"><button className="secondary-button" onClick={downloadIndividualXlsx}>Individual Excel <span>↓</span></button><button className="secondary-button" onClick={downloadAggregateXlsx}>Aggregate Excel <span>↓</span></button></div></div>
      <div className="review-table">
        <div className="table-row table-head"><span>Bridge & card</span>{tokenTypes.map((type) => <span key={type.id}>{type.short}</span>)}<span>Total</span><span>Narratives</span></div>
        {bridges.map((bridge, b) => {
          const hasAny = cardKeys.some((k) => aggregate.byBridgeCard[`${b}-${k}`] && Object.values(aggregate.byBridgeCard[`${b}-${k}`]).some((v) => typeof v === "number" && v > 0));
          if (!hasAny) return <div className="table-row empty-row" key={b}><span className="bridge-cell"><b>{b + 1}</b>{bridge.title}</span><span className="narrative-cell muted">No tokens allocated</span></div>;
          return cardKeys.map((k) => {
            const meta = cardMeta.find((c) => c.key === k);
            const agg = aggregate.byBridgeCard[`${b}-${k}`];
            if (!agg || (agg.celebration + agg.improvement + agg.transformation + agg.connect === 0 && agg.narratives.length === 0)) return null;
            const total = agg.celebration + agg.improvement + agg.transformation + agg.connect;
            return <div className="table-row" key={`${b}-${k}`}><span className="bridge-cell"><b>{b + 1}</b>{bridge.title}<em className="card-tag">Card {k} · {meta.label}</em></span>{tokenTypes.map((type) => <span className={type.color} key={type.id}>{agg[type.id]}</span>)}<span className="total-cell">{total}</span><span className="narrative-cell">{agg.narratives.length > 0 ? `${agg.narratives.length} ${agg.narratives.length === 1 ? "narrative" : "narratives"}` : "—"}</span></div>;
          });
        })}
      </div>
    </div>
    <div className="review-table-wrap narratives-section"><div className="section-heading"><div><span className="eyebrow">ALL NARRATIVES</span><h2>Delegate suggestions by bridge & card</h2></div></div>
      <div className="narratives-list">
        {bridges.map((bridge, b) => cardKeys.map((k) => {
          const meta = cardMeta.find((c) => c.key === k);
          const agg = aggregate.byBridgeCard[`${b}-${k}`];
          if (!agg || agg.narratives.length === 0) return null;
          return <div className="narrative-block" key={`${b}-${k}`}>
            <div className="narrative-block-head"><span className="bridge-tag">Bridge {b + 1} · Card {k}</span><strong>{bridge.title}</strong><small>{meta.label}</small></div>
            {agg.narratives.map((n, i) => <div className="narrative-item" key={i}><span className="delegate-name">{n.delegate || "Anonymous"}</span><p>{n.narrative}</p></div>)}
          </div>;
        }))}
      </div>
    </div>
  </main>;
}

export default App;


export default App