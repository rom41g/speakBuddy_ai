import { britishPronunciation } from '../shared/britishDictionary'
import type { BritishPronunciation } from '../shared/britishDictionary'

type Rewriter = {
  on(
    selector: string,
    handlers: { element?(): void; text?(chunk: { text: string }): void },
  ): Rewriter
  transform(response: Response): Response
}
const rewriter = (
  globalThis as typeof globalThis & { HTMLRewriter: new () => Rewriter }
).HTMLRewriter

export async function cambridgePronunciation(
  word: string,
  key: string,
  dictionary: string,
): Promise<BritishPronunciation> {
  const fallback = britishPronunciation(word)
  if (fallback.forms.length) return fallback
  const url = new URL(
    `https://dictionary.cambridge.org/api/v1/dictionaries/${encodeURIComponent(dictionary)}/search/first`,
  )
  url.search = new URLSearchParams({ q: word, format: 'html' }).toString()
  const response = await fetch(url, {
    headers: { Accept: 'application/json', accessKey: key },
    redirect: 'manual',
    signal: AbortSignal.timeout(6500),
  })
  if (!response.ok) return fallback
  const entry = (await response.json()) as {
    entryContent?: string
    entryLabel?: string
    entryUrl?: string
  }
  const label = entry.entryLabel
    ?.replace(/<[^>]+>/g, '')
    .replace(/&#39;|&apos;|’/g, "'")
    .trim()
    .toLowerCase()
  if (
    !label ||
    (label !== word && !label.startsWith(`${word} (`)) ||
    !entry.entryContent
  )
    return fallback

  const samples: string[] = []
  const selector = '.uk .ipa'
  const parser = new rewriter().on(selector, {
    element() {
      samples.push('')
    },
    text(chunk) {
      if (samples.length) samples[samples.length - 1] += chunk.text
    },
  })
  await parser.transform(new Response(entry.entryContent)).arrayBuffer()
  const ipa = samples
    .map((sample) =>
      sample
        .trim()
        .replace(/^\/|\/$/g, '')
        .replace(/\s+r$/, 'ʳ')
        .trim(),
    )
    .filter(
      (sample) =>
        sample.length <= 90 &&
        /[a-zɐ-ʯ]/i.test(sample) &&
        !/[<>&]/.test(sample),
    )
  const forms = [...new Set(ipa)].slice(0, 6).map((value) => ({ ipa: value }))
  if (!forms.length) return fallback
  const source =
    entry.entryUrl &&
    /^https:\/\/dictionary\.cambridge\.org\//.test(entry.entryUrl)
      ? entry.entryUrl
      : fallback.url
  return { word, forms, url: source }
}
