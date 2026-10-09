// Invio email: Resend se configurato, altrimenti log di sviluppo.
// L'invio reale avviene SOLO dopo approvazione umana (messages.status=approved).

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  dedupKey: string;
}): Promise<{ ok: boolean; provider: 'resend' | 'dev-log'; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Preventivi <preventivi@example.it>';

  if (!apiKey) {
    console.log(`[DEV-EMAIL] to=${opts.to} subject=${opts.subject} dedup=${opts.dedupKey}`);
    return { ok: true, provider: 'dev-log', id: 'dev_' + Date.now() };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html })
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, provider: 'resend', error: t };
    }
    const j = (await res.json()) as { id?: string };
    return { ok: true, provider: 'resend', id: j.id };
  } catch (e: any) {
    return { ok: false, provider: 'resend', error: String(e?.message || e) };
  }
}

export function quoteEmailHtml(args: {
  companyName: string;
  customerName: string;
  quoteTitle: string;
  amount: string;
  link: string;
  body: string;
}): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto">
    <h2>${args.companyName}</h2>
    <p>Ciao ${args.customerName},</p>
    <p>${args.body.replace(/\n/g, '<br/>')}</p>
    <p><strong>${args.quoteTitle}</strong> — <strong>${args.amount}</strong></p>
    <p><a href="${args.link}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Apri il preventivo</a></p>
    <p style="color:#64748b;font-size:12px">Il link è personale e scade il giorno indicato nel preventivo. Se non hai richiesto tu questo preventivo, ignora questa email.</p>
  </div>`;
}
