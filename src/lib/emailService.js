import crypto from "crypto";

/**
 * Service d'envoi d'emails pour pretymelo.
 * Supporte :
 * 1. Resend (si RESEND_API_KEY est défini)
 * 2. Brevo (si BREVO_API_KEY est défini)
 * 3. Mode Simulation / Dev (log en console et retour du lien en local)
 */
export async function sendPasswordResetEmail({ to, name = "Créateur", resetUrl }) {
  const fromEmail = process.env.EMAIL_FROM || "pretymelo <no-reply@pretymelo.com>";
  const subject = "Réinitialisation de votre mot de passe pretymelo";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">pretymelo</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 13px;">Studio de Création Musicale IA</p>
    </div>
    
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Bonjour ${name},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0 24px 0;">
        Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte pretymelo. Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe :
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
          Réinitialiser mon mot de passe →
        </a>
      </div>

      <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 24px 0 8px 0;">
        Ce lien de sécurité est valable pendant <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
      </p>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />

      <p style="font-size: 11px; color: #94a3b8; word-break: break-all; margin: 0;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
        <a href="${resetUrl}" style="color: #7c3aed;">${resetUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Bonjour ${name},

Nous avons reçu une demande de réinitialisation de votre mot de passe pretymelo.
Cliquez sur ce lien pour réinitialiser votre mot de passe (valable 1 heure) :

${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail.
L'équipe pretymelo.
  `.trim();

  // 1. Envoi via Resend (si configuré)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      if (res.ok) {
        return { success: true, provider: "resend" };
      }
      console.warn("[EmailService] Échec envoi Resend :", await res.text());
    } catch (err) {
      console.error("[EmailService] Erreur Resend :", err);
    }
  }

  // 2. Envoi via Brevo / Sendinblue (si configuré)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "pretymelo", email: process.env.BREVO_SENDER_EMAIL || "contact@pretymelo.com" },
          to: [{ email: to, name }],
          subject,
          htmlContent,
          textContent,
        }),
      });

      if (res.ok) {
        return { success: true, provider: "brevo" };
      }
      console.warn("[EmailService] Échec envoi Brevo :", await res.text());
    } catch (err) {
      console.error("[EmailService] Erreur Brevo :", err);
    }
  }

  // 3. Fallback Dev / Simulation (Console)
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("📧 [EMAIL SIMULATION] Réinitialisation de mot de passe");
  console.log(`Destinataire  : ${to} (${name})`);
  console.log(`Sujet         : ${subject}`);
  console.log(`Lien direct   : ${resetUrl}`);
  console.log("══════════════════════════════════════════════════════════════════\n");

  return { success: true, provider: "console", resetUrl };
}

