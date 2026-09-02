import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobTitle, company, jobDescription } = await req.json()
    if (!jobTitle || !company) {
      return NextResponse.json({ error: 'Job title and company are required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const prompt = `Generate 10 interview questions for ${jobTitle} at ${company}.
Job description: ${jobDescription || 'Not provided'}

Return ONLY valid JSON (no markdown, no extra text):
{
  "questions": [
    {
      "question": "string",
      "category": "Technical|Behavioral|Company-specific|Salary/HR",
      "difficulty": "Easy|Medium|Hard",
      "hint": "string - brief hint for the answer",
      "sampleAnswer": "string - AI suggested answer"
    }
  ]
}

Distribution: 4 Technical, 3 Behavioral, 2 Company-specific, 1 Salary/HR
Mix of Easy, Medium, Hard difficulties`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
        })
      }
    )

    const data = await res.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format from Gemini')
    }

    return NextResponse.json({ questions: parsed.questions })
  } catch (e) {
    const err = e as Error
    console.error('Interview prep error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate questions' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: sessions } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ sessions: sessions || [] })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}