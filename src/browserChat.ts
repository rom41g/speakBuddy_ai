import { chatPrompt } from '../shared/chatPrompt'
import { containsContact, grammarHint } from '../shared/lessons'
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

function cleanReply(raw: string, latest: string) {
  let content = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
    .replace(/^(?:Buddy|Assistant):\s*/i, '')
    .split(/\n\s*(?:User|Learner|Student):/i, 1)[0]
    .trim()
  const learner = latest.trim().replace(/[.!?]+$/, '')
  if (
    learner.length >= 16 &&
    content.toLowerCase().startsWith(learner.toLowerCase())
  ) {
    const tail = content.slice(learner.length)
    if (/^[.!?]*$/.test(tail)) throw new Error('copied response')
    const followUp = tail.match(/^[.!?]+\s+(.+)$/s)?.[1]
    if (followUp) content = followUp.trim()
  }
  if (
    !content ||
    content.length > 300 ||
    /<\/?think>/i.test(content) ||
    containsContact(content)
  )
    throw new Error('invalid response')
  return content
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
  let displayed = ''
  const updatePreview =
    preview &&
    ((raw: string) => {
      if (signal.aborted) return
      const complete = raw.match(/^[\s\S]*[.!?](?=\s|$)/)?.[0]
      if (!complete || complete.length < 10) return
      try {
        const content = cleanReply(complete, latest)
        if (
          content !== displayed &&
          !input.history.some((message) => message.content === content)
        ) {
          displayed = content
          preview(content)
        }
      } catch {
        // Wait for the complete reply before showing it.
      }
    })
  if (languageModel) {
    try {
      if ((await languageModel.availability()) === 'available') {
        const budget = AbortSignal.any([signal, AbortSignal.timeout(12000)])
        const turns = input.history.map(({ role, content }) => ({
          role,
          content,
        }))
        const last = turns.pop()!
        const session = await languageModel.create({
          initialPrompts: [
            { role: 'system', content: chatPrompt(input) },
            ...turns.slice(turns[0]?.role === 'assistant' ? 1 : 0),
          ],
          signal: budget,
        })
        try {
          let reply = ''
          const stream =
            updatePreview &&
            session.promptStreaming?.(last.content, { signal: budget })
          if (stream) {
            const reader = stream.getReader()
            try {
              for (;;) {
                const chunk = await reader.read()
                if (chunk.done) break
                reply += chunk.value
                updatePreview(reply)
              }
            } finally {
              reader.releaseLock()
            }
          } else {
            reply = await session.prompt(last.content, { signal: budget })
          }
          return {
            role: 'assistant',
            content: cleanReply(reply, latest),
            correction,
          }
        } finally {
          session.destroy()
        }
      }
    } catch {
      // The bundled model also runs in browsers without the Prompt API.
      preview?.('')
    }
  }
  signal.throwIfAborted()
  const { localReply } = await import('./localChat')
  const content = cleanReply(
    await localReply(input, signal, status, updatePreview),
    latest,
  )
  return {
    role: 'assistant',
    content,
    correction,
  }
}
