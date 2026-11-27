import { freeChatInstructions } from '../shared/conversation'
import { containsContact } from '../shared/lessons'
import type { Message } from '../shared/lessons'

export type ModelAvailability =
  'available' | 'downloadable' | 'downloading' | 'unavailable'

type ModelOptions = {
  expectedInputs: { type: 'text'; languages: string[] }[]
  expectedOutputs: { type: 'text'; languages: string[] }[]
}
type BrowserSession = {
  prompt(input: string, options: { signal: AbortSignal }): Promise<string>
  destroy(): void
}
const languageModel = (
  globalThis as typeof globalThis & {
    LanguageModel?: {
      availability(options: ModelOptions): Promise<ModelAvailability>
      create(
        options: ModelOptions & {
          initialPrompts?: { role: 'system'; content: string }[]
          signal: AbortSignal
        },
      ): Promise<BrowserSession>
    }
  }
).LanguageModel

const options: ModelOptions = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
}

export async function browserModelAvailability(): Promise<ModelAvailability> {
  try {
    return (await languageModel?.availability(options)) ?? 'unavailable'
  } catch {
    return 'unavailable'
  }
}

export async function enableBrowserModel(signal: AbortSignal) {
  if (!languageModel) throw new Error('unavailable')
  const session = await languageModel.create({ ...options, signal })
  session.destroy()
}

export async function browserChat(
  history: Message[],
  signal: AbortSignal,
): Promise<Message> {
  if (!languageModel) throw new Error('unavailable')
  const budget = AbortSignal.any([signal, AbortSignal.timeout(20000)])
  const session = await languageModel.create({
    ...options,
    initialPrompts: [{ role: 'system', content: `${freeChatInstructions} Write only the reply.` }],
    signal: budget,
  })
  try {
    const context = JSON.stringify(
      history.map(({ role, content }) => ({ role, content })),
    )
    const content = (await session.prompt(context, { signal: budget })).trim()
    if (!content || content.length > 240 || containsContact(content))
      throw new Error('invalid response')
    return { role: 'assistant', content }
  } finally {
    session.destroy()
  }
}
