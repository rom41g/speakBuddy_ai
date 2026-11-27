/// <reference lib="webworker" />
import { KokoroTTS } from 'kokoro-js'

const scope = self as unknown as DedicatedWorkerGlobalScope
const modelId = 'onnx-community/Kokoro-82M-v1.0-ONNX'
let model: Promise<KokoroTTS> | undefined
let queue = Promise.resolve()
const pending = new Set<number>()

function loadEmma() {
  model ??= KokoroTTS.from_pretrained(modelId, {
    dtype: 'q8',
    device: 'wasm',
  })
    .then((voice) => {
      scope.postMessage({ ready: true })
      return voice
    })
    .catch((error: unknown) => {
      model = undefined
      throw error
    })
  return model
}

scope.onmessage = ({
  data,
}: MessageEvent<
  | { warmup: true }
  | { cancel: number }
  | { id: number; text: string; rate: number }
>) => {
  if ('warmup' in data) {
    void loadEmma().catch(() => {})
    return
  }
  if ('cancel' in data) {
    pending.delete(data.cancel)
    return
  }
  pending.add(data.id)
  queue = queue.then(async () => {
    if (!pending.has(data.id)) return
    try {
      const voice = await loadEmma()
      if (!pending.has(data.id)) return
      const audio = await voice.generate(data.text, {
        voice: 'bf_emma',
        speed: data.rate,
      })
      if (!pending.has(data.id)) return
      const samples = new Float32Array(audio.audio)
      scope.postMessage(
        { id: data.id, samples, sampleRate: audio.sampling_rate },
        [samples.buffer],
      )
    } catch {
      if (pending.has(data.id)) scope.postMessage({ id: data.id, failed: true })
    } finally {
      pending.delete(data.id)
    }
  })
}
