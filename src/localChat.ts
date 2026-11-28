import { Wllama } from '@wllama/wllama'
import wasm from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import { chatPrompt } from '../shared/chatPrompt'
import { chatHistory } from '../shared/chatReply'
import { chatLevel } from '../shared/chatLevel'
import type { ChatRequest } from '../shared/lessons'

const mainModel = {
  url: 'https://huggingface.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF/resolve/main/LFM2.5-1.2B-Instruct-Q4_K_M.gguf',
  megabytes: 731,
}
const compactModel = {
  url: 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf',
  megabytes: 397,
}

export type ModelStatus =
  | { phase: 'downloading'; megabytes: number; percent?: number }
  | { phase: 'starting' | 'thinking' }
let engine: Promise<Wllama> | undefined
let progress: ModelStatus = { phase: 'starting' }
const listeners = new Set<(status: ModelStatus) => void>()

function setProgress(status: ModelStatus) {
  progress = status
  listeners.forEach((update) => update(status))
}

async function loadChatModel({ url, megabytes }: typeof mainModel) {
  const model = new Wllama(
    { default: wasm },
    { allowOffline: true, suppressNativeLog: true },
  )
  model.setCompat('default')
  setProgress({ phase: 'starting' })

  async function modelFiles() {
    const cached = (await model.modelManager.getModels()).find((entry) => entry.url === url)
    if (cached) return cached.open()
    setProgress({ phase: 'downloading', megabytes })
    const downloaded = await model.modelManager.downloadModel(url, {
      signal: AbortSignal.timeout(600000),
      progressCallback: ({ loaded, total }) => setProgress({
        phase: 'downloading',
        megabytes,
        percent: total > 0 ? Math.min(100, Math.floor((loaded / total) * 100)) : undefined,
      }),
    })
    return downloaded.open()
  }

  try {
    const blobs = await (navigator.locks
      ? navigator.locks.request(`speakbuddy-chat-model:${url}`, modelFiles)
      : modelFiles())
    setProgress({ phase: 'starting' })
    await model.loadModel(blobs, {
      n_ctx: 1536,
      n_batch: 256,
      n_parallel: 1,
      warmup: true,
    })
    progress = { phase: 'thinking' }
    return model
  } catch (error) {
    await model.exit().catch(() => {})
    throw error
  }
}

export function prepareLocalChat() {
  if (!engine) {
    const device = navigator as Navigator & {
      deviceMemory?: number
      connection?: { saveData?: boolean }
    }
    const compact = (device.deviceMemory ?? Infinity) <= 2 || device.connection?.saveData
    const loading = compact
      ? loadChatModel(compactModel)
      : loadChatModel(mainModel).catch(() => loadChatModel(compactModel))
    engine = loading.catch((error: unknown) => {
      engine = undefined
      throw error
    })
  }
  return engine
}

export async function localReply(
  input: ChatRequest,
  signal: AbortSignal,
  update: (status: ModelStatus) => void,
  preview?: (content: string) => void,
  retry = false,
) {
  const loading = prepareLocalChat()
  listeners.add(update)
  update(progress)
  const model = await loading.finally(() => listeners.delete(update))
  signal.throwIfAborted()
  update({ phase: 'thinking' })
  const turns = chatHistory(input, retry)
  const budget = AbortSignal.any([signal, AbortSignal.timeout(60000)])
  let content = ''
  let limited = false
  await model.createChatCompletion({
    messages: [{ role: 'system', content: chatPrompt(input, retry) }, ...turns],
    chat_template_kwargs: { enable_thinking: false },
    cache_prompt: true,
    temperature: input.mode === 'free' ? 0.62 : 0.48,
    penalty_repeat: 1.1,
    max_tokens: chatLevel(input).tokens,
    abortSignal: budget,
    stream: true,
    onData: (chunk) => {
      const choice = chunk.choices?.[0]
      if (choice?.finish_reason === 'length') limited = true
      const delta = choice?.delta.content
      if (!delta) return
      content += delta
      preview?.(content)
    },
  })
  const full = content.trim()
  return limited ? (full.match(/^[\s\S]*[.!?](?=\s|$)/)?.[0] ?? full) : full
}
