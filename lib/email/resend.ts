import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'noreply@rahulpatle.xyz'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Clover'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clover.rahulpatle.xyz'

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px; margin: 0 auto; background: #ffffff;
`
const greenBtn = `
  display: inline-block; background: #1a7a4a; color: #ffffff;
  padding: 12px 28px; border-radius: 8px; text-decoration: none;
  font-weight: 600; font-size: 15px; margin: 20px 0;
`

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to,
    subject: `Welcome to ${APP_NAME} 🍀`,
    html: `
      <div style="${baseStyle}">
        <div style="background:#1a7a4a;padding:28px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🍀 ${APP_NAME}</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1a1a1a;margin:0 0 12px;">Hey ${name}! 👋</h2>
          <p style="color:#555;line-height:1.6;">Your account is ready. Upload your resume and let Clover find the best-matched jobs for you — then apply in one click.</p>
          <a href="${APP_URL}/dashboard" style="${greenBtn}">Go to dashboard →</a>
          <p style="color:#999;font-size:13px;margin-top:24px;">If you didn't sign up, ignore this email.</p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  return resend.emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="${baseStyle}">
        <div style="background:#1a7a4a;padding:28px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🍀 ${APP_NAME}</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1a1a1a;margin:0 0 12px;">Reset your password</h2>
          <p style="color:#555;line-height:1.6;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="${greenBtn}">Reset password →</a>
          <p style="color:#999;font-size:13px;margin-top:24px;">If you didn't request this, ignore this email. Your password won't change.</p>
        </div>
      </div>
    `,
  })
}

export async function sendApplicationEmail(opts: {
  to: string
  userName: string
  jobTitle: string
  company: string
  coverLetter: string
  resumeUrl: string
  userEmail: string
}) {
  return resend.emails.send({
    from: `${opts.userName} <${FROM}>`,
    to: opts.to,
    replyTo: opts.userEmail,
    subject: `Application for ${opts.jobTitle} — ${opts.userName}`,
    html: `
      <div style="${baseStyle}">
        <div style="padding:32px;">
          <p style="color:#333;line-height:1.7;">${opts.coverLetter}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
          <p style="color:#555;font-size:14px;">
            Resume: <a href="${opts.resumeUrl}" style="color:#1a7a4a;">${opts.resumeUrl}</a>
          </p>
          <p style="color:#999;font-size:12px;">Sent via ${APP_NAME}</p>
        </div>
      </div>
    `,
    cc: [opts.userEmail],
  })
}

export async function sendJobDigestEmail(to: string, name: string, jobs: any[]) {
  const jobRows = jobs.map(j => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
        <strong style="color:#1a1a1a;">${j.title}</strong><br/>
        <span style="color:#555;font-size:13px;">${j.company} · ${j.location}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;">
        <span style="background:#e8f5ee;color:#1a7a4a;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${j.matchScore}% match</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;">
        <a href="${APP_URL}/jobs?id=${j.id}" style="color:#1a7a4a;font-size:13px;">View →</a>
      </td>
    </tr>
  `).join('')

  return resend.emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to,
    subject: `🍀 ${jobs.length} new job matches for you`,
    html: `
      <div style="${baseStyle}">
        <div style="background:#1a7a4a;padding:28px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">🍀 Daily job digest</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#555;">Hey ${name}, here are today's top matches:</p>
          <table style="width:100%;border-collapse:collapse;">${jobRows}</table>
          <a href="${APP_URL}/jobs" style="${greenBtn}">See all matches →</a>
        </div>
      </div>
    `,
  })
}
