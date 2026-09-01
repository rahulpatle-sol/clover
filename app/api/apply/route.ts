import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendApplicationEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { jobId, jobTitle, company, jobUrl, hrEmail, coverLetter, userName, resumeUrl, matchScore } = body

    // Send email
    await sendApplicationEmail({
      to: hrEmail,
      userName,
      jobTitle,
      company,
      coverLetter,
      resumeUrl,
      userEmail: user.email!,
    })

    // Log application in DB
    await supabase.from('applications').insert({
      user_id: user.id,
      job_id: jobId,
      job_title: jobTitle,
      company,
      job_url: jobUrl,
      status: 'applied',
      match_score: matchScore || 0,
      source: 'clover',
    })

    // Send notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Application sent!',
      message: `Applied to ${jobTitle} at ${company}`,
      type: 'success',
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
