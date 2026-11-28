import type { BritishForm } from '../shared/britishDictionary'

let current: HTMLAudioElement | undefined

export function stopDictionaryAudio() {
  current?.pause()
  current = undefined
}

export async function playDictionaryAudio(form: BritishForm) {
  stopDictionaryAudio()
  if (!form.file) return 'unavailable'
  const audio = new Audio(`${import.meta.env.BASE_URL}dictionary-audio/${form.file}?v=cori`)
  current = audio
  try {
    await audio.play()
    return 'playing'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError')
      return 'blocked'
    if (current !== audio) return 'stopped'
    return 'unavailable'
  }
}
