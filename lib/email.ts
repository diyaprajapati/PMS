import nodemailer from "nodemailer";

/**
 * Creates a nodemailer transporter using Gmail SMTP configuration.
 */
function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error(
      "SMTP configuration is missing. Please set SMTP_USER and SMTP_PASSWORD (Google App Password) in your .env file."
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

/**
 * Sends a project invitation email to a user.
 */
export async function sendProjectInvitationEmail(
  toEmail: string,
  inviterName: string | null,
  inviterEmail: string,
  projectName: string,
  role: string,
  projectId: string
): Promise<void> {
  const transporter = createTransporter();

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const projectUrl = `${appUrl}/projects?project=${projectId}`;

  const roleDisplayName = role.charAt(0) + role.slice(1).toLowerCase();

  const mailOptions = {
    from: `"Project Management System" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `You've been invited to join "${projectName}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Project Invitation</h1>
            <p>Hello,</p>
            <p>
              <strong>${inviterName || inviterEmail}</strong> has invited you to join the project 
              <strong>"${projectName}"</strong> as a <strong>${roleDisplayName}</strong>.
            </p>
            <p>
              You can now access this project and collaborate with the team.
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${projectUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Project
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact ${inviterName || inviterEmail} at ${inviterEmail}.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Project Invitation

Hello,

${inviterName || inviterEmail} has invited you to join the project "${projectName}" as a ${roleDisplayName}.

You can now access this project and collaborate with the team.

View Project: ${projectUrl}

If you have any questions, please contact ${inviterName || inviterEmail} at ${inviterEmail}.

---
This is an automated message. Please do not reply to this email.
    `.trim(),
  };

  await transporter.sendMail(mailOptions);
}
