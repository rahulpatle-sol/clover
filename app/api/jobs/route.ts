import { NextResponse } from 'next/server'
import { fetchAllJobs } from '@/lib/jobs/fetch'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let skills: string[] = []
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('skills').eq('id', user.id).single()
      skills = prof?.skills || []
    }
    const jobs = await fetchAllJobs(skills)
    return NextResponse.json({ jobs, count: jobs.length })
  } catch (e) {
    return NextResponse.json({ jobs: [], error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
