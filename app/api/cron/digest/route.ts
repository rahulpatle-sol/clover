import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAllJobs } from '@/lib/jobs/fetch'
import { sendJobDigestEmail } from '@/lib/email/resend'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: profiles } = await supabase.from('profiles').select('id,email,full_name,skills').not('skills','is',null)
  let sent = 0
  for (const prof of (profiles || [])) {
    if (!prof.skills?.length) continue
    const jobs = await fetchAllJobs(prof.skills)
    const topJobs = jobs.filter(j => (j.matchScore||0) >= 70).slice(0, 5)
    if (topJobs.length > 0) {
      await sendJobDigestEmail(prof.email, prof.full_name || 'there', topJobs)
      sent++
    }
  }
  return NextResponse.json({ success: true, sent })
}
