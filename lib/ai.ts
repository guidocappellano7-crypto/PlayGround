// AI OPZIONALE: prepara SOLO testi (subject/body).
// Non decide mai prezzi, condizioni, scadenze né invia.
// Se il provider non è disponibile -> fallback a template locale. Il prodotto resta operativo.

export async function draftMessageText(args: {
  companyName: string;
  customerName: string;
  quoteTitle: string;
  amount: string;
  kind: 'initial' | 'reminder' | 'last_call';
}): Promise<{ subject: string; body: string; ai: boolean }> {
  const { companyName, customerName, quoteTitle, amount, kind } = args;

  const templates: Record<string, { subject: string; body: string }> = {
    initial: {
      subject: `${companyName} — il tuo preventivo: ${quoteTitle}`,
      body: `Ti abbiamo preparato il preventivo "${quoteTitle}" da ${amount}.\n\nAprilo dal link sicuro, controlla voci e condizioni e facci sapere: puoi accettare, farci una domanda o declinare. Rispondiamo entro 24h lavorative.`
    },
    reminder: {
      subject: `Promemoria gentile — ${quoteTitle} (${amount})`,
      body: `Ciao ${customerName}, ti ricordiamo che il preventivo "${quoteTitle}" da ${amount} è ancora disponibile.\n\nSe hai dubbi su tempi, pagamenti o dettagli tecnici, scrivici pure dal link: ti aiutiamo a decidere senza impegno.`
    },
    last_call: {
      subject: `In scadenza — ${quoteTitle}: vuoi tenerlo attivo?`,
      body: `Il preventivo "${quoteTitle}" da ${amount} scade a breve.\n\nSe ti serve più tempo o una revisione delle voci, dillo dal link e lo aggiorniamo. Altrimenti lo archivieremo automaticamente.`
    }
  };

  const base = templates[kind] || templates.reminder;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) return { ...base, ai: false };

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content:
              'Sei un assistente commerciale italiano. Scrivi SOLO oggetto e corpo di una email cordiale e breve. NON inventare prezzi, sconti, scadenze o condizioni: usa solo quelli forniti. Non promettere nulla oltre a ricontatto umano.'
          },
          {
            role: 'user',
            content: `Azienda: ${companyName}. Cliente: ${customerName}. Preventivo: ${quoteTitle}. Totale (fisso, non modificare): ${amount}. Tipo: ${kind}. Base: ${base.body}`
          }
        ]
      })
    });
    if (!res.ok) return { ...base, ai: false };
    const j = await res.json();
    const text: string = j.choices?.[0]?.message?.content || '';
    if (!text) return { ...base, ai: false };
    const lines = text.split('\n').filter(Boolean);
    return {
      subject: base.subject,
      body: text.slice(0, 1200),
      ai: true
    };
  } catch {
    return { ...base, ai: false };
  }
}
