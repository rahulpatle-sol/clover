import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — Clover' }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', padding:'48px 24px' }}>
      <div style={{ maxWidth:720, margin:'0 auto', background:'#fff', borderRadius:16, padding:'40px 48px', border:'1px solid #e5e7eb' }}>
        <Link href="/" style={{ color:'#1a7a4a', textDecoration:'none', fontSize:14, display:'inline-flex', alignItems:'center', gap:6, marginBottom:28 }}>← Back to Clover</Link>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
          <span style={{ fontSize:24 }}>🍀</span>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#1a1a1a' }}>Privacy Policy</h1>
        </div>
        <p style={{ color:'#888', fontSize:13, marginBottom:32 }}>Last updated: {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>

        {[
          { title:'1. Information we collect', content:'We collect information you provide directly: your name, email address, resume (PDF), and professional details like job title and location. We also collect usage data to improve the platform.' },
          { title:'2. How we use your information', content:'Your information is used to: match you with relevant job opportunities, send application emails on your behalf, deliver transactional emails (welcome, password reset), and improve our job matching algorithm.' },
          { title:'3. Resume data', content:'Your resume is stored securely in Supabase Storage with Row Level Security (RLS). Only you can access your resume file. We extract skills from your resume to power job matching — this extracted data is stored in your profile.' },
          { title:'4. Email communications', content:'We use Resend to send emails. When you apply to a job, we send an email to the HR contact you specify, with a CC to your own email. We never send emails without your explicit action.' },
          { title:'5. Data sharing', content:'We do not sell your personal data. We do not share your information with third parties except: Supabase (database/storage provider) and Resend (email provider), both under strict data processing agreements.' },
          { title:'6. Data security', content:'Your data is protected using Row Level Security (RLS) policies, ensuring you can only access your own data. All data is transmitted over HTTPS. Passwords are managed by Supabase Auth and never stored in plain text.' },
          { title:'7. Your rights', content:'You have the right to: access your personal data, update or correct your information, delete your account and all associated data, and export your data. Contact us at hello@rahulpatle.xyz for any requests.' },
          { title:'8. Cookies', content:'We use essential cookies for authentication sessions only. We do not use tracking or advertising cookies.' },
          { title:'9. Changes to this policy', content:'We may update this Privacy Policy from time to time. We will notify you of significant changes via email.' },
          { title:'10. Contact', content:'For any privacy-related questions, contact us at hello@rahulpatle.xyz' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1a1a', marginBottom:8 }}>{s.title}</h2>
            <p style={{ color:'#555', lineHeight:1.7, fontSize:14 }}>{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
