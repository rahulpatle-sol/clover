import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json()
    
    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing resumeText or jobDescription' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const prompt = `Compare this resume text with the job description.
Return JSON only:
{
  "score": 0-100,
  "matched": ["skill1", "skill2"],
  "missing": ["skill3", "skill4"],
  "suggestions": ["tip1", "tip2", "tip3"],
  "verdict": "Strong/Average/Weak"
}

Resume:
${resumeText.slice(0, 3000)}

Job Description:
${jobDescription.slice(0, 3000)}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
        }),
      }
    )

    const data = await res.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = content.replace(/```json|```/g, '').trim()
    
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
    }

    const score = Math.max(0, Math.min(100, parsed.score || 0))
    const verdict = score >= 70 ? 'Strong' : score >= 40 ? 'Average' : 'Weak'

    return NextResponse.json({
      score,
      matched: Array.isArray(parsed.matched) ? parsed.matched.slice(0, 20) : [],
      missing: Array.isArray(parsed.missing) ? parsed.missing.slice(0, 20) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
      verdict,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}