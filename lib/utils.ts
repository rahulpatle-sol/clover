import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function generateCoverLetter(opts: {
  userName: string
  jobTitle: string
  company: string
  skills: string[]
}): string {
  const topSkills = opts.skills.slice(0, 4).join(', ')
  return `Dear Hiring Manager,

I am writing to express my interest in the ${opts.jobTitle} position at ${opts.company}. As a passionate developer with hands-on experience in ${topSkills}, I am confident I can contribute meaningfully to your team.

I have built production-grade applications with a focus on performance, clean architecture, and user experience. I am excited about the opportunity to bring this expertise to ${opts.company}.

I would love to discuss how my skills align with your team's goals. Thank you for your time and consideration.

Best regards,
${opts.userName}`
}
