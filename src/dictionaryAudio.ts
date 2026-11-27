import type { BritishForm } from '../shared/britishDictionary'

let current: HTMLAudioElement | undefined

export function stopDictionaryAudio() {
  current?.pause()
  current = undefined
}

export async function playDictionaryAudio(form: BritishForm) {
  stopDictionaryAudio()
  const audio = new Audio()
  current = audio
  const backup =
    form.file && `${import.meta.env.BASE_URL}dictionary-audio/${form.file}`
  for (const url of [form.audio, backup]) {
    if (!url || current !== audio) continue
    audio.src = url
    try {
      await audio.play()
      return url === form.audio ? 'recording' : 'ipa'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError')
        return 'blocked'
    }
  }
  return 'unavailable'
}
