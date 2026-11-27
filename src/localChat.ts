import { Wllama } from '@wllama/wllama'
import wasm from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import { chatPrompt } from '../shared/chatPrompt'
import type { ChatRequest } from '../shared/lessons'

const modelUrl =
  'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf'

export type ModelStatus =
  { phase: 'loading'; percent?: number } | { phase: 'thinking' }
let engine: Promise<Wllama> | undefined
let progress: ModelStatus = { phase: 'loading' }
const listeners = new Set<(status: ModelStatus) => void>()

async function loadModel(status: (status: ModelStatus) => void) {
  listeners.add(status)
  if (!engine) {
    const model = new Wllama(
      { default: wasm },
      { allowOffline: true, suppressNativeLog: true },
    )
    model.setCompat('default')
    progress = { phase: 'loading' }
    engine = model
      .loadModelFromUrl(modelUrl, {
        n_ctx: 1536,
        n_batch: 128,
        signal: AbortSignal.timeout(600000),
        progressCallback: ({ loaded, total }) => {
          progress = {
            phase: 'loading',
            percent:
              total > 0
                ? Math.min(100, Math.floor((loaded / total) * 100))
                : undefined,
          }
          listeners.forEach((update) => update(progress))
        },
      })
      .then(() => model)
      .catch(async (error: unknown) => {
        engine = undefined
        await model.exit().catch(() => {})
        throw error
      })
  }
  status(progress)
  try {
    return await engine
  } finally {
    listeners.delete(status)
  }
}

export async function localReply(
  input: ChatRequest,
  signal: AbortSignal,
  update: (status: ModelStatus) => void,
) {
  const model = await loadModel(update)
  signal.throwIfAborted()
  update({ phase: 'thinking' })
  const turns = input.history.map(({ role, content }) => ({
    role,
    content: content.replace(/<\|[^<>]*\|>/g, ''),
  }))
  const instructions = chatPrompt(input)
  const budget = AbortSignal.any([signal, AbortSignal.timeout(60000)])
  const output = await complete(instructions, turns)
  if (
    input.mode !== 'free' &&
    turns.some(
      (turn) =>
        turn.role === 'assistant' &&
        turn.content.toLowerCase() === output.toLowerCase(),
    )
  ) {
    return complete(
      `${instructions} The learner just answered. Respond to their answer and advance the activity.`,
      turns.slice(-1),
    )
  }
  return output

  async function complete(prompt: string, history: typeof turns) {
    const result = await model.createChatCompletion({
      messages: [{ role: 'system', content: prompt }, ...history],
      chat_template_kwargs: { enable_thinking: false },
      temperature: 0.62,
      max_tokens: 68,
      abortSignal: budget,
    })
    return result.choices[0]?.message.content?.trim() ?? ''
  }
}
