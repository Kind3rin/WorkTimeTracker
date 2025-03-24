import nodemailer from 'nodemailer';
import { User } from '@shared/schema';
import crypto from 'crypto';

// Configurazione del trasporto email
// Utilizziamo le credenziali di Brevo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER || '88a8f9001@smtp-brevo.com',
    pass: process.env.EMAIL_PASS || 'xSgXDMwA7WVpUnvk'
  },
  // Aumenta il timeout per dare più tempo al server SMTP di rispondere
  connectionTimeout: 10000, // 10 secondi
  greetingTimeout: 10000,  // 10 secondi
  socketTimeout: 20000     // 20 secondi
});

// Genera un token casuale
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Genera una password temporanea
export function generateTemporaryPassword(): string {
  return crypto.randomBytes(6).toString('hex');
}

// Invia email di invito con password temporanea
export async function sendInvitationEmail(
  user: User, 
  temporaryPassword: string, 
  invitationToken: string
): Promise<boolean> {
  try {
    console.log(`[DEBUG] Tentativo di invio email a: ${user.email}`);
    console.log(`[DEBUG] Configurazione SMTP: host=${process.env.EMAIL_HOST || 'smtp-relay.brevo.com'}, port=${parseInt(process.env.EMAIL_PORT || '587')}`);
    
    // Ottieni l'URL corrente dell'applicazione
    const appUrl = process.env.APP_URL || 'https://workspace.replit.dev';
    const invitationUrl = `${appUrl}/invitation/${invitationToken}`;
    
    console.log(`[DEBUG] URL di invito: ${invitationUrl}`);
    
    // Per test e sviluppo, stampa sempre a console l'email (così possiamo vederla)
    console.log(`
        [EMAIL SIMULATA]
        A: ${user.email}
        Oggetto: Invito a Time Tracker
        ------------------------------
        Gentile ${user.fullName},
        
        Sei stato invitato a unirsi all'applicazione Time Tracker.
        
        Username: ${user.username}
        Password temporanea: ${temporaryPassword}
        
        Per accedere, visita il seguente link:
        ${invitationUrl}
        
        La password temporanea e il link di invito scadranno fra 24 ore.
        Ti verrà richiesto di cambiare la password al primo accesso.
        
        Cordiali saluti,
        Il team di Time Tracker
      `);
    
    // In ambiente di sviluppo non inviamo realmente l'email, ma restituiamo comunque successo
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
      return true;
    }
    
    // Configurazione dell'email
    const mailOptions = {
      from: process.env.EMAIL_USER || '88a8f9001@smtp-brevo.com',
      to: user.email,
      subject: 'Invito a Time Tracker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
          <h2 style="color: #3b82f6;">Invito a Time Tracker</h2>
          <p>Gentile ${user.fullName},</p>
          <p>Sei stato invitato a unirsi all'applicazione Time Tracker.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Password temporanea:</strong> ${temporaryPassword}</p>
          </div>
          
          <p>Per accedere, clicca sul seguente pulsante:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #3b82f6; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accedi a Time Tracker
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            La password temporanea e il link di invito scadranno fra 24 ore.<br>
            Ti verrà richiesto di cambiare la password al primo accesso.
          </p>
          
          <p>Cordiali saluti,<br>Il team di Time Tracker</p>
        </div>
      `
    };
    
    console.log(`[DEBUG] Invio email a: ${mailOptions.to} da: ${mailOptions.from}`);
    
    // Verifica la connessione SMTP prima di inviare
    try {
      const verifyResult = await transporter.verify();
      console.log(`[DEBUG] Verifica SMTP: ${verifyResult ? 'Successo' : 'Fallita'}`);
    } catch (verifyError) {
      console.error('[DEBUG] Errore verifica SMTP:', verifyError);
      // Continua comunque a provare a inviare l'email
    }
    
    // Invia l'email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[DEBUG] Email inviata con successo: ${JSON.stringify(info)}`);
    return true;
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email:', error);
    return false;
  }
}