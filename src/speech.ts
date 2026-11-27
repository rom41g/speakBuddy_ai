type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>
      }) => void)
    | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

export const SpeechRecognition =
  (
    window as Window & {
      SpeechRecognition?: new () => Recognition
      webkitSpeechRecognition?: new () => Recognition
    }
  ).SpeechRecognition ??
  (window as Window & { webkitSpeechRecognition?: new () => Recognition })
    .webkitSpeechRecognition

export type PlaybackStatus =
  'starting' | 'playing' | 'ended' | 'blocked' | 'unavailable'

let playing: { utterance: SpeechSynthesisUtterance; cancel(): void } | undefined

export function stopSpeaking() {
  playing?.cancel()
}

export function speak(
  text: string,
  rate = 0.88,
  update?: (status: PlaybackStatus) => void,
) {
  stopSpeaking()
  const synthesis = window.speechSynthesis
  if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    update?.('unavailable')
    return
  }

  const voices = synthesis
    .getVoices()
    .filter((voice) => /^en(?:[-_]|$)/i.test(voice.lang))
  const american = (voice: SpeechSynthesisVoice) =>
    /^en[-_]us$/i.test(voice.lang)
  const voice =
    voices.find((item) => american(item) && item.localService) ??
    voices.find((item) => item.localService) ??
    voices.find(american) ??
    voices[0]
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = voice?.lang ?? 'en-US'
  utterance.rate = rate
  if (voice) utterance.voice = voice

  const timeout = window.setTimeout(() => finish('unavailable', true), 6000)
  function finish(status: PlaybackStatus, cancel = false) {
    if (playing?.utterance !== utterance) return
    playing = undefined
    window.clearTimeout(timeout)
    utterance.onstart = utterance.onend = utterance.onerror = null
    if (cancel) synthesis.cancel()
    update?.(status)
  }

  playing = { utterance, cancel: () => finish('ended', true) }
  update?.('starting')
  utterance.onstart = () => {
    window.clearTimeout(timeout)
    update?.('playing')
  }
  utterance.onend = () => finish('ended')
  utterance.onerror = (event) =>
    finish(event.error === 'not-allowed' ? 'blocked' : 'unavailable')
  try {
    if (synthesis.paused) synthesis.resume()
    synthesis.speak(utterance)
  } catch {
    finish('unavailable')
  }
}

export function playbackMessage(
  status: PlaybackStatus | undefined,
  t: (ru: string, en: string) => string,
) {
  if (status === 'starting') return t('Готовлю озвучку…', 'Preparing audio…')
  if (status === 'playing') return t('Бадди говорит…', 'Buddy is speaking…')
  if (status === 'blocked')
    return t(
      'Нажми на динамик рядом с ответом, чтобы запустить звук.',
      'Press the speaker beside the reply to play it.',
    )
  if (status === 'unavailable')
    return t(
      'Браузер не смог озвучить текст. Проверь доступность английского голоса.',
      'The browser could not play speech. Check for an English voice.',
    )
  return ''
}

export async function makeWav(blob: Blob) {
  const context = new AudioContext()
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer())
    const sampleRate = 16000
    const length = Math.ceil(decoded.duration * sampleRate)
    const offline = new OfflineAudioContext(1, length, sampleRate)
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start()
    const samples = (await offline.startRendering()).getChannelData(0)
    const bytes = new ArrayBuffer(44 + samples.length * 2)
    const header = new DataView(bytes)
    const string = (offset: number, label: string) =>
      [...label].forEach((char, index) =>
        header.setUint8(offset + index, char.charCodeAt(0)),
      )
    string(0, 'RIFF')
    header.setUint32(4, bytes.byteLength - 8, true)
    string(8, 'WAVE')
    string(12, 'fmt ')
    header.setUint32(16, 16, true)
    header.setUint16(20, 1, true)
    header.setUint16(22, 1, true)
    header.setUint32(24, sampleRate, true)
    header.setUint32(28, sampleRate * 2, true)
    header.setUint16(32, 2, true)
    header.setUint16(34, 16, true)
    string(36, 'data')
    header.setUint32(40, samples.length * 2, true)
    samples.forEach((value, index) => {
      const normalized = Math.max(-1, Math.min(1, value))
      header.setInt16(
        44 + index * 2,
        Math.round(normalized * (normalized < 0 ? 32768 : 32767)),
        true,
      )
    })
    return new Blob([bytes], { type: 'audio/wav' })
  } finally {
    await context.close()
  }
}
