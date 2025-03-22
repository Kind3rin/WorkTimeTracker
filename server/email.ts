import nodemailer from 'nodemailer';
import { User } from '@shared/schema';
import crypto from 'crypto';

// Configurazione del trasporto email
// In produzione, questi valori dovrebbero essere presi da variabili d'ambiente
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASSWORD || 'password'
  }
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
    // Per test in ambiente di sviluppo, stampa a console invece di inviare email
    if (process.env.NODE_ENV === 'development') {
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
        http://localhost:5000/invitation/${invitationToken}
        
        La password temporanea e il link di invito scadranno fra 24 ore.
        Ti verrà richiesto di cambiare la password al primo accesso.
        
        Cordiali saluti,
        Il team di Time Tracker
      `);
      return true;
    }
    
    // Configurazione dell'email
    const mailOptions = {
      from: process.env.SMTP_FROM || 'timetracker@example.com',
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
            <a href="http://localhost:5000/invitation/${invitationToken}" 
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
    
    // Invia l'email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email:', error);
    return false;
  }
}