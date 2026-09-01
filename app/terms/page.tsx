import Link from 'next/link'

export const metadata = { title: 'Terms of Service — Clover' }

export default function TermsPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', padding:'48px 24px' }}>
      <div style={{ maxWidth:720, margin:'0 auto', background:'#fff', borderRadius:16, padding:'40px 48px', border:'1px solid #e5e7eb' }}>
        <Link href="/" style={{ color:'#1a7a4a', textDecoration:'none', fontSize:14, display:'inline-flex', alignItems:'center', gap:6, marginBottom:28 }}>← Back to Clover</Link>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
          <span style={{ fontSize:24 }}>🍀</span>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#1a1a1a' }}>Terms of Service</h1>
        </div>
        <p style={{ color:'#888', fontSize:13, marginBottom:32 }}>Last updated: {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>

        {[
          { title:'1. Acceptance of terms', content:'By using Clover, you agree to these Terms of Service. If you do not agree, please do not use the platform.' },
          { title:'2. Description of service', content:'Clover is a job application tracking platform that helps users find job opportunities, manage their applications, and connect with potential referrers. The service is provided free of charge.' },
          { title:'3. User accounts', content:'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and password. You must be at least 16 years old to use this service.' },
          { title:'4. Acceptable use', content:'You agree not to: use the platform to send spam or unsolicited emails, misrepresent your identity or qualifications, attempt to access other users\' data, or use the service for any illegal purpose.' },
          { title:'5. Resume and content', content:'You retain ownership of your resume and any content you upload. By uploading content, you grant us a limited license to process and store it for the purpose of providing the service.' },
          { title:'6. Job applications', content:'You are solely responsible for the accuracy of your applications and cover letters. Clover is a tool to assist you — we do not guarantee job placement or responses from employers.' },
          { title:'7. Referral network', content:'The referral network is for genuine professional connections only. Misuse, including false claims of employment or harassment, will result in account termination.' },
          { title:'8. Disclaimer of warranties', content:'Clover is provided "as is" without warranties of any kind. We do not guarantee the accuracy of job listings or the outcome of any application.' },
          { title:'9. Limitation of liability', content:'Clover shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.' },
          { title:'10. Termination', content:'We reserve the right to terminate or suspend accounts that violate these terms. You may delete your account at any time from your profile settings.' },
          { title:'11. Contact', content:'For questions about these terms, contact us at hello@rahulpatle.xyz' },
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
