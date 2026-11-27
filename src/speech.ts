type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult:
    | ((event: {
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal?: boolean }
        >
      }) => void)
    | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
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

let playing: AbortController | undefined
let currentUtterance: SpeechSynthesisUtterance | undefined
const emojiInSpeech =
  /[0-9#*]\uFE0F?\u20E3|[\p{Extended_Pictographic}\p{Emoji_Presentation}][\u200D\uFE0E\uFE0F\p{Emoji_Modifier}\u{E0020}-\u{E007F}]*/gu

export function stopSpeaking() {
  stopDictionaryAudio()
  playing?.abort()
}

export function selectBritishVoice(voices: readonly SpeechSynthesisVoice[]) {
  const ukVoices = voices.filter((voice) =>
    /^en[-_]gb(?:$|[-_])/i.test(voice.lang),
  )
  return (
    ukVoices.find((voice) =>
      /natural|neural|enhanced|premium/i.test(voice.name),
    ) ??
    ukVoices.find((voice) => /google|sonia|ryan/i.test(voice.name)) ??
    ukVoices.find((voice) => voice.localService) ??
    ukVoices[0]
  )
}

async function playBrowserVoice(
  text: string,
  rate: number,
  signal: AbortSignal,
  started: () => void,
): Promise<'ended' | 'blocked' | 'unavailable'> {
  const synthesis = window.speechSynthesis
  if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined')
    return 'unavailable'
  let voices = synthesis.getVoices()
  if (!voices.length) {
    await new Promise<void>((resolve) => {
      const timer = window.setTimeout(ready, 300)
      function ready() {
        window.clearTimeout(timer)
        synthesis.removeEventListener('voiceschanged', ready)
        signal.removeEventListener('abort', ready)
        resolve()
      }
      synthesis.addEventListener('voiceschanged', ready, { once: true })
      signal.addEventListener('abort', ready, { once: true })
    })
    voices = synthesis.getVoices()
  }
  if (signal.aborted) return 'ended'
  const voice = selectBritishVoice(voices)
  if (!voice) return 'unavailable'
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = britishLocale
  utterance.voice = voice
  utterance.rate = rate
  currentUtterance = utterance
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => finish('unavailable', true), 6000)
    function cancel() {
      finish('ended', true)
    }
    function finish(
      status: 'ended' | 'blocked' | 'unavailable',
      cancelAudio = false,
    ) {
      if (currentUtterance === utterance) currentUtterance = undefined
      window.clearTimeout(timeout)
      signal.removeEventListener('abort', cancel)
      utterance.onstart = utterance.onend = utterance.onerror = null
      if (cancelAudio) synthesis.cancel()
      resolve(status)
    }
    signal.addEventListener('abort', cancel, { once: true })
    utterance.onstart = () => {
      window.clearTimeout(timeout)
      started()
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
  })
}

export function speak(
  text: string,
  rate = 0.88,
  update?: (status: PlaybackStatus) => void,
  continuation?: Promise<string>,
) {
  stopSpeaking()
  const controller = new AbortController()
  playing = controller
  const { signal } = controller
  update?.('starting')
  void play()

  async function play() {
    let status = await playPart(text)
    if (status === 'ended' && !signal.aborted && continuation) {
      const rest = await continuation
      if (rest && !signal.aborted) status = await playPart(rest)
    }
    finish(status)
  }

  async function playPart(
    part: string,
  ): Promise<'ended' | 'blocked' | 'unavailable'> {
    const spoken = part
      .replace(emojiInSpeech, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[ \t]+([,.!?;:])/g, '$1')
      .trim()
    if (!/[\p{L}\p{N}]/u.test(spoken)) return 'ended'

    return playBrowserVoice(spoken, rate, signal, () => {
      if (!signal.aborted) update?.('playing')
    }).catch(() => 'unavailable' as const)
  }

  function finish(status: PlaybackStatus) {
    if (playing !== controller) return
    playing = undefined
    update?.(signal.aborted ? 'ended' : status)
  }
}

export function playbackMessage(
  status: PlaybackStatus | undefined,
  t: (ru: string, en: string) => string,
) {
  if (status === 'starting')
    return t('Готовлю британскую озвучку…', 'Preparing British audio…')
  if (status === 'playing') return t('Бадди говорит…', 'Buddy is speaking…')
  if (status === 'blocked')
    return t(
      'Нажми на динамик рядом с ответом, чтобы запустить звук.',
      'Press the speaker beside the reply to play it.',
    )
  if (status === 'unavailable')
    return t(
      'Британский голос недоступен. Проверь наличие English (United Kingdom) в настройках озвучки устройства.',
      'No British voice is available. Check for an English (United Kingdom) voice in the device’s speech settings.',
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
import { stopDictionaryAudio } from './dictionaryAudio'

export const britishLocale = 'en-GB'
