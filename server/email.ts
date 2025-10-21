import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export async function sendInvitationEmail(
  to: string,
  organizationName: string,
  inviteToken: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const inviteUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/signup/${inviteToken}`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `You've been invited to join ${organizationName} on Tfive`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #003C51 0%, #2D9DA8 100%);
                padding: 40px 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .header h1 {
                color: white;
                margin: 0;
                font-size: 32px;
                font-weight: 700;
              }
              .header p {
                color: rgba(255, 255, 255, 0.9);
                margin: 10px 0 0;
                font-size: 16px;
              }
              .content {
                background: #ffffff;
                padding: 40px 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .content h2 {
                color: #003C51;
                margin-top: 0;
                font-size: 24px;
              }
              .content p {
                margin: 16px 0;
                color: #4b5563;
              }
              .button {
                display: inline-block;
                background: #2D9DA8;
                color: white;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-weight: 600;
                margin: 24px 0;
              }
              .button:hover {
                background: #248991;
              }
              .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 8px 8px;
              }
              .footer p {
                color: #6b7280;
                font-size: 14px;
                margin: 5px 0;
              }
              .divider {
                border-top: 1px solid #e5e7eb;
                margin: 30px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Tfive</h1>
              <p>25 Minutes to Personal Growth</p>
            </div>
            <div class="content">
              <h2>You're Invited!</h2>
              <p>You've been invited to join <strong>${organizationName}</strong> on Tfive, an AI-powered personal development platform.</p>
              <p>Tfive helps you drive personal growth through focused 25-minute sessions with AI coaching, structured learning, and progress tracking.</p>
              <p>Click the button below to accept your invitation and create your account:</p>
              <center>
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </center>
              <div class="divider"></div>
              <p style="font-size: 14px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #2D9DA8;">${inviteUrl}</a>
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                This invitation will expire in 7 days.
              </p>
            </div>
            <div class="footer">
              <p>This email was sent by Tfive</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }

    console.log('Invitation email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    throw error;
  }
}
