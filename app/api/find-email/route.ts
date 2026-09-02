import { NextRequest, NextResponse } from 'next/server'

interface HunterEmail {
  value: string
  confidence: number
  first_name: string | null
  last_name: string | null
  position: string | null
  linkedin: string | null
  sources?: Array<{ uri: string }>
}

interface EmailResult {
  email: string
  confidence: number
  firstName: string | null
  lastName: string | null
  position: string | null
  linkedin: string | null
  sources: string[]
}

function companyToDomain(company: string): string {
  const clean = company
    .toLowerCase()
    .replace(/\b(inc|ltd|pvt|llc|corp|corporation|company|co|limited|private|technologies|technology|tech|solutions|solution|systems|system|services|service|global|international|intl|group|holdings|holding|ventures|venture|labs|lab|studio|studios|digital|ai|io)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
  return `${clean}.com`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const company = searchParams.get('company')
  const domain = searchParams.get('domain')

  if (!company && !domain) {
    return NextResponse.json({ error: 'Missing company or domain parameter' }, { status: 400 })
  }

  const targetDomain = domain || companyToDomain(company!)
  const apiKey = process.env.HUNTER_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'HUNTER_API_KEY not configured' }, { status: 500 })
  }

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(targetDomain)}&api_key=${apiKey}&limit=5`
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.errors?.[0]?.details || 'Hunter.io API error' }, { status: res.status })
    }

    const emails: HunterEmail[] = data.data?.emails || []
    const results: EmailResult[] = emails.map((e) => ({
      email: e.value,
      confidence: e.confidence,
      firstName: e.first_name,
      lastName: e.last_name,
      position: e.position,
      linkedin: e.linkedin,
      sources: e.sources?.map((s) => s.uri) || [],
    }))

    return NextResponse.json({ domain: targetDomain, emails: results })
  } catch (e) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}