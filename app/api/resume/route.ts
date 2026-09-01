import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseResumeWithGemini, extractSkillsFromText } from '@/lib/resume/parser'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('resume') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Dynamic import for pdf-parse
    const pdfParse = await import('pdf-parse')
    const pdfFn = (pdfParse as any).default || pdfParse
    const pdfData = await pdfFn(buffer)
    const text = pdfData.text

    const result = await parseResumeWithGemini(text)
    return NextResponse.json({ ...result, text: text.slice(0, 2000) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, skills: [], jobTitle: 'Developer' }, { status: 500 })
  }
}
