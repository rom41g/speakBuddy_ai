import { chatPrompt } from '../shared/chatPrompt'
import {
  asksAboutRepetition,
  chatHistory,
  replyFilter,
} from '../shared/chatReply'
import { grammarHint } from '../shared/lessons'
import type { ChatRequest, Message } from '../shared/lessons'
import type { ModelStatus } from './localChat'

type BrowserMessage = { role: 'system' | 'user' | 'assistant'; content: string }
type BrowserSession = {
  prompt(input: string, options: { signal: AbortSignal }): Promise<string>
  promptStreaming?(
    input: string,
    options: { signal: AbortSignal },
  ): ReadableStream<string>
  destroy(): void
}
const languageModel = (
  globalThis as typeof globalThis & {
    LanguageModel?: {
      availability(): Promise<string>
      create(options: {
        initialPrompts: BrowserMessage[]
        signal: AbortSignal
      }): Promise<BrowserSession>
    }
  }
).LanguageModel

export async function prepareBrowserChat() {
  if (
    (await languageModel?.availability().catch(() => 'unavailable')) ===
    'available'
  )
    return
  const { prepareLocalChat } = await import('./localChat')
  await prepareLocalChat()
}

export async function browserChat(
  input: ChatRequest,
  signal: AbortSignal,
  status: (state: ModelStatus) => void,
  preview?: (content: string) => void,
): Promise<Message> {
  status({ phase: 'thinking' })
  const latest = input.history.at(-1)?.content ?? ''
  const correction = grammarHint(latest)
  const clean = replyFilter(input)
  let displayed = ''
  const updatePreview =
    preview &&
    ((raw: string) => {
      if (signal.aborted) return
      const content = clean(raw, true)
      if (content && content !== displayed) {
        displayed = content
        preview(content)
      }
    })

  async function requestReply(generate: (retry: boolean) => Promise<string>) {
    for (const retry of [false, true]) {
      signal.throwIfAborted()
      if (retry && displayed) return displayed
      const content = clean(await generate(retry))
      if (content) return content
    }
  }

  if (languageModel) {
    const nativeModel = languageModel
    try {
      if ((await nativeModel.availability()) === 'available') {
        const budget = AbortSignal.any([signal, AbortSignal.timeout(12000)])
        const content = await requestReply(async (retry) => {
          budget.throwIfAborted()
          const turns = chatHistory(input, retry)
          const last = turns.pop()?.content ?? latest
          const session = await nativeModel.create({
            initialPrompts: [
              { role: 'system', content: chatPrompt(input, retry) },
              ...turns.slice(turns[0]?.role === 'assistant' ? 1 : 0),
            ],
            signal: budget,
          })
          try {
            const stream =
              updatePreview &&
              session.promptStreaming?.(last, { signal: budget })
            if (!stream) return await session.prompt(last, { signal: budget })
            let reply = ''
            const reader = stream.getReader()
            try {
              for (;;) {
                const chunk = await reader.read()
                if (chunk.done) return reply
                reply += chunk.value
                updatePreview(reply)
              }
            } finally {
              reader.releaseLock()
            }
          } finally {
            session.destroy()
          }
        })
        if (content) return { role: 'assistant', content, correction }
      }
    } catch {
      // The bundled model also runs in browsers without the Prompt API.
      signal.throwIfAborted()
      if (displayed)
        return { role: 'assistant', content: displayed, correction }
    }
  }
  signal.throwIfAborted()
  const { localReply } = await import('./localChat')
  const content = await requestReply((retry) =>
    localReply(input, signal, status, updatePreview, retry),
  )
  if (!content && asksAboutRepetition(latest))
    return {
      role: 'assistant',
      content:
        'I got stuck repeating the same phrase. Let’s pick up where we left off.',
    }
  if (!content) throw new Error('no usable reply')
  return {
    role: 'assistant',
    content,
    correction,
  }
}
