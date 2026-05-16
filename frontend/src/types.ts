export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Recommendation {
  name: string
  url: string
  test_type: string
}

export interface ChatResponse {
  reply: string
  recommendations: Recommendation[]
  end_of_conversation: boolean
}

export const TEST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  A: { label: 'Ability', color: '#6366f1' },
  B: { label: 'Situational', color: '#8b5cf6' },
  C: { label: 'Competency', color: '#a855f7' },
  D: { label: 'Development', color: '#06b6d4' },
  E: { label: 'Exercise', color: '#0ea5e9' },
  K: { label: 'Knowledge', color: '#10b981' },
  P: { label: 'Personality', color: '#f59e0b' },
  S: { label: 'Simulation', color: '#ef4444' },
}
