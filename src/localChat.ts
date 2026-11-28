import { Wllama } from '@wllama/wllama'
import wasm from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import { chatPrompt } from '../shared/chatPrompt'
import { chatHistory } from '../shared/chatReply'
import { chatLevel } from '../shared/chatLevel'
import type { ChatRequest } from '../shared/lessons'

const modelUrl =
  'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf'

export type ModelStatus =
  | { phase: 'downloading'; percent?: number }
  | { phase: 'starting' | 'thinking' }
let engine: Promise<Wllama> | undefined
let progress: ModelStatus = { phase: 'starting' }
const listeners = new Set<(status: ModelStatus) => void>()

function setProgress(status: ModelStatus) {
  progress = status
  listeners.forEach((update) => update(status))
}

export function prepareLocalChat() {
  if (!engine) {
    const model = new Wllama(
      { default: wasm },
      { allowOffline: true, suppressNativeLog: true },
    )
    model.setCompat('default')
    setProgress({ phase: 'starting' })
    async function modelFiles() {
      const cached = (await model.modelManager.getModels()).find(
        (entry) => entry.url === modelUrl,
      )
      if (cached) return cached.open()
      setProgress({ phase: 'downloading' })
      const downloaded = await model.modelManager.downloadModel(modelUrl, {
        signal: AbortSignal.timeout(600000),
        progressCallback: ({ loaded, total }) =>
          setProgress({
            phase: 'downloading',
            percent:
              total > 0
                ? Math.min(100, Math.floor((loaded / total) * 100))
                : undefined,
          }),
      })
      return downloaded.open()
    }
    const files = navigator.locks
      ? navigator.locks.request('speakbuddy-chat-model', modelFiles)
      : modelFiles()
    engine = files
      .then((blobs) => {
        setProgress({ phase: 'starting' })
        return model.loadModel(blobs, {
          n_ctx: 1536,
          n_batch: 256,
          n_parallel: 1,
          warmup: true,
        })
      })
      .then(() => {
        progress = { phase: 'thinking' }
        return model
      })
      .catch(async (error: unknown) => {
        engine = undefined
        await model.exit().catch(() => {})
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
