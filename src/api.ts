const endpoint = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : null)
)?.replace(/\/$/, '')

export type Capabilities = {
  chat: boolean
  dictionary?: boolean
  pronunciation: 'local' | 'azure' | null
}
export type Assessment = {
  provider: 'local' | 'azure'
  accuracy: number
  fluency?: number
  completeness?: number
  words: {
    word: string
    score?: number
    omitted: boolean
    needsPractice: boolean
    phonemes: { symbol: string; score: number }[]
  }[]
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (endpoint == null) throw new Error('unconfigured')
  const response = await fetch(`${endpoint}/api/${path}`, {
    ...init,
    signal: AbortSignal.timeout(28000),
  })
  if (!response.ok) throw new Error(String(response.status))
  return response.json() as Promise<T>
}
