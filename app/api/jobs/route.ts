import { NextResponse } from 'next/server'
import { fetchAllJobs } from '@/lib/jobs/fetch'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || ''
    const role = searchParams.get('role') || ''
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let skills: string[] = []
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('skills').eq('id', user.id).single()
      skills = prof?.skills || []
    }
    const jobs = await fetchAllJobs(skills, city, role)
    return NextResponse.json({ jobs, count: jobs.length })
  } catch (e) {
    return NextResponse.json({ jobs: [], error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
