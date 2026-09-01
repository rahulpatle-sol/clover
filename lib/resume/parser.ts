// Skill keywords to detect from resume
const SKILL_KEYWORDS = [
  // Frontend
  'react','next.js','nextjs','vue','angular','svelte','typescript','javascript','html','css',
  'tailwind','sass','scss','redux','zustand','graphql','rest api','webpack','vite',
  // Backend
  'node.js','nodejs','express','fastapi','django','flask','spring','laravel','php','ruby',
  'python','java','golang','go','rust','axum','tokio',
  // Database
  'postgresql','postgres','mysql','mongodb','redis','sqlite','prisma','supabase','firebase',
  // DevOps
  'docker','kubernetes','aws','gcp','azure','vercel','netlify','ci/cd','github actions','linux',
  // Web3
  'solana','ethereum','anchor','smart contracts','blockchain','defi','nft','web3','rust',
  'solidity','hardhat','foundry',
  // Tools
  'git','figma','postman','jira','agile','scrum',
]

export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase()
  const found = SKILL_KEYWORDS.filter(skill => lower.includes(skill))
  // Deduplicate and format
  return [...new Set(found)].map(s => {
    const map: Record<string,string> = {
      'nextjs': 'Next.js', 'next.js': 'Next.js',
      'nodejs': 'Node.js', 'node.js': 'Node.js',
      'react': 'React', 'typescript': 'TypeScript',
      'javascript': 'JavaScript', 'postgresql': 'PostgreSQL',
      'mongodb': 'MongoDB', 'solana': 'Solana', 'rust': 'Rust',
      'docker': 'Docker', 'graphql': 'GraphQL',
    }
    return map[s] || s.charAt(0).toUpperCase() + s.slice(1)
  })
}

// Parse resume using Gemini AI (free)
export async function parseResumeWithGemini(text: string): Promise<{
  skills: string[]
  jobTitle: string
  summary: string
}> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Fallback to regex parsing
    return {
      skills: extractSkillsFromText(text),
      jobTitle: 'Software Developer',
      summary: text.slice(0, 200),
    }
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract from this resume (respond ONLY with valid JSON, no markdown):
{
  "skills": ["list of technical skills"],
  "jobTitle": "current/target job title",
  "summary": "2 sentence professional summary"
}

Resume:
${text.slice(0, 3000)}`
            }]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
        })
      }
    )
    const data = await res.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      skills: parsed.skills || extractSkillsFromText(text),
      jobTitle: parsed.jobTitle || 'Software Developer',
      summary: parsed.summary || '',
    }
  } catch {
    return {
      skills: extractSkillsFromText(text),
      jobTitle: 'Software Developer',
      summary: '',
    }
  }
}
