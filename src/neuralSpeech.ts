let context: AudioContext | undefined
let resumed: Promise<void> | undefined
let worker: Worker | undefined
let nextId = 0

export function unlockBritishAudio() {
  try {
    if (!context || context.state === 'closed') context = new AudioContext()
    if (context.state !== 'running' && !resumed)
      resumed = context
        .resume()
        .catch(() => {})
        .finally(() => {
          resumed = undefined
        })
  } catch {
    /* Web Speech can still use an installed British voice. */
  }
}

function ensureWorker() {
  worker ??= new Worker(new URL('./britishVoice.worker.ts', import.meta.url), {
    type: 'module',
  })
  return worker
}

export function prepareBritishNeural() {
  try {
    ensureWorker().postMessage({ warmup: true })
  } catch {
    /* Playback can still try an installed voice. */
  }
}

function synthesize(text: string, rate: number, signal: AbortSignal) {
  const engine = ensureWorker()
  const id = ++nextId
  return new Promise<{
    samples: Float32Array<ArrayBuffer>
    sampleRate: number
  }>((resolve, reject) => {
    function clean() {
      window.clearTimeout(timer)
      signal.removeEventListener('abort', failed)
      engine.removeEventListener('message', received)
      engine.removeEventListener('error', broken)
    }
    function failed() {
      clean()
      reject(new Error('British voice unavailable'))
    }
    function broken() {
      if (worker === engine) {
        engine.terminate()
        worker = undefined
      }
      failed()
    }
    function received(
      event: MessageEvent<{
        id: number
        failed?: boolean
        samples: Float32Array<ArrayBuffer>
        sampleRate: number
      }>,
    ) {
      if (event.data.id !== id) return
      if (event.data.failed) failed()
      else {
        clean()
        resolve(event.data)
      }
    }
    const timer = window.setTimeout(failed, 120000)
    engine.addEventListener('message', received)
    engine.addEventListener('error', broken)
    signal.addEventListener('abort', failed, { once: true })
    if (signal.aborted) failed()
    else engine.postMessage({ id, text, rate })
  })
}

export async function playBritishNeural(
  text: string,
  rate: number,
  signal: AbortSignal,
  started: () => void,
) {
  if (!context) return 'unavailable'
  if (context.state !== 'running' && resumed) {
    let timeout: number | undefined
    await Promise.race([
      resumed,
      new Promise<void>((resolve) => {
        timeout = window.setTimeout(resolve, 500)
      }),
    ])
    window.clearTimeout(timeout)
  }
  if (context.state !== 'running') return 'blocked'
  if (signal.aborted) return 'ended'
  const { samples, sampleRate } = await synthesize(text, rate, signal)
  if (signal.aborted) return 'ended'
  const buffer = context.createBuffer(1, samples.length, sampleRate)
  buffer.copyToChannel(samples, 0)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  return new Promise<'ended'>((resolve) => {
    function ended() {
      signal.removeEventListener('abort', abort)
      source.disconnect()
      resolve('ended')
    }
    function abort() {
      source.stop()
    }
    source.onended = ended
    signal.addEventListener('abort', abort, { once: true })
    source.start()
    started()
  })
}
