export interface Job {
  id: string
  title: string
  company: string
  location: string
  url: string
  description: string
  tags: string[]
  salary?: string
  source: string
  postedAt: string
  matchScore?: number
}

// Remotive API - no key needed
async function fetchRemotive(query = 'developer'): Promise<Job[]> {
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${query}&limit=20`, {
      next: { revalidate: 3600 }
    })
    const data = await res.json()
    return (data.jobs || []).map((j: any) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || 'Remote',
      url: j.url,
      description: j.description?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
      tags: j.tags || [],
      salary: j.salary || '',
      source: 'Remotive',
      postedAt: j.publication_date,
    }))
  } catch { return [] }
}

// Arbeitnow API - no key needed
async function fetchArbeitnow(): Promise<Job[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api?page=1', {
      next: { revalidate: 3600 }
    })
    const data = await res.json()
    return (data.data || []).slice(0, 20).map((j: any) => ({
      id: `arbeitnow-${j.slug}`,
      title: j.title,
      company: j.company_name,
      location: j.location || 'Remote',
      url: j.url,
      description: j.description?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
      tags: j.tags || [],
      salary: '',
      source: 'Arbeitnow',
      postedAt: j.created_at,
    }))
  } catch { return [] }
}

// Web3.career API - no key needed
async function fetchWeb3Career(): Promise<Job[]> {
  try {
    const res = await fetch('https://web3.career/api/v1?token=free_limited_token', {
      next: { revalidate: 3600 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data || []).slice(0, 10).map((j: any) => ({
      id: `web3-${j.id}`,
      title: j.title,
      company: j.company,
      location: j.location || 'Remote',
      url: `https://web3.career/${j.slug}`,
      description: (j.excerpt || '').slice(0, 300),
      tags: j.tags || [],
      salary: j.salary || '',
      source: 'Web3.career',
      postedAt: j.date,
    }))
  } catch { return [] }
}

// Adzuna India API - requires ADZUNA_APP_ID and ADZUNA_APP_KEY
async function fetchAdzuna(role = 'developer', city = ''): Promise<Job[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return []
  
  try {
    const where = city ? `&where=${encodeURIComponent(city)}` : ''
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${encodeURIComponent(role)}${where}&content-type=application/json`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()
    return (data.results || []).map((j: any) => ({
      id: `adzuna-${j.id}`,
      title: j.title,
      company: j.company?.display_name || 'Company',
      location: j.location?.display_name || city || 'India',
      url: j.redirect_url,
      description: (j.description || '').slice(0, 300),
      tags: j.category?.tag ? [j.category.tag] : [],
      salary: j.salary_min ? `₹${Math.round(j.salary_min/100000)}–${Math.round((j.salary_max||j.salary_min*1.3)/100000)} LPA` : '',
      source: 'Adzuna',
      postedAt: j.created,
    }))
  } catch { return [] }
}

// Score job against user skills
export function scoreJob(job: Job, userSkills: string[]): number {
  if (!userSkills.length) return 0
  const jobText = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase()
  const matched = userSkills.filter(s => jobText.includes(s.toLowerCase()))
  return Math.round((matched.length / userSkills.length) * 100)
}

// Main: fetch all sources and score
export async function fetchAllJobs(userSkills: string[] = [], city = '', role = ''): Promise<Job[]> {
  const [remotive, arbeitnow, web3, adzuna] = await Promise.allSettled([
    fetchRemotive('developer'),
    fetchArbeitnow(),
    fetchWeb3Career(),
    fetchAdzuna(role || 'developer', city),
  ])

  const all: Job[] = [
    ...(remotive.status === 'fulfilled' ? remotive.value : []),
    ...(arbeitnow.status === 'fulfilled' ? arbeitnow.value : []),
    ...(web3.status === 'fulfilled' ? web3.value : []),
    ...(adzuna.status === 'fulfilled' ? adzuna.value : []),
  ]

  // Add match scores
  const scored = all.map(job => ({
    ...job,
    matchScore: scoreJob(job, userSkills),
  }))

  // Sort by match score
  return scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
}

export const INDIA_CITIES = ['All India','Mumbai','Delhi','Bangalore','Hyderabad','Pune','Chennai','Indore','Bhopal','Noida','Gurgaon','Ahmedabad','Kolkata']
export const JOB_ROLES = ['All','Full Stack','Frontend','Backend','React','Node.js','Web3','Solana','DevOps','Mobile']
