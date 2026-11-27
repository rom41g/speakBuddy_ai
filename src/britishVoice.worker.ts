/// <reference lib="webworker" />
import { KokoroTTS } from 'kokoro-js'

const scope = self as unknown as DedicatedWorkerGlobalScope
const modelId = 'onnx-community/Kokoro-82M-v1.0-ONNX'
let model: Promise<KokoroTTS> | undefined
let queue = Promise.resolve()

scope.onmessage = ({
  data,
}: MessageEvent<
  { warmup: true } | { id: number; text: string; rate: number }
>) => {
  queue = queue.then(async () => {
    try {
      model ??= KokoroTTS.from_pretrained(modelId, {
        dtype: 'q8',
        device: 'wasm',
      })
      const voice = await model
      if ('warmup' in data) return
      const audio = await voice.generate(data.text, {
        voice: 'bf_emma',
        speed: data.rate,
      })
      const samples = new Float32Array(audio.audio)
      scope.postMessage(
        { id: data.id, samples, sampleRate: audio.sampling_rate },
        [samples.buffer],
      )
    } catch {
      model = undefined
      if ('id' in data) scope.postMessage({ id: data.id, failed: true })
    }
  })
}
