import lexicon from './academy/lexicon.json'

export type BritishForm = {
  ipa: string
  sense?: 'base' | 'past' | 'verb' | 'noun'
  file?: string
}
export type BritishPronunciation = {
  word: string
  forms: BritishForm[]
  url: string
  ru?: string
  source?: 'wiktionary' | 'composed' | 'phonemized' | 'cambridge'
}

const entries = new Map<string, BritishPronunciation>(
  Object.entries(lexicon).map(([word, entry]) => [
    word.toLowerCase(),
    {
      word,
      forms: entry.forms as BritishForm[],
      url:
        'url' in entry && typeof entry.url === 'string'
          ? entry.url
          : 'phonemized' in entry
            ? 'https://github.com/espeak-ng/espeak-ng'
            : 'https://kaikki.org/dictionary/English/',
      ru: entry.ru,
      source: 'phonemized' in entry ? 'phonemized'
        : 'compiled' in entry ? 'composed'
        : 'url' in entry && entry.url?.startsWith('https://dictionary.cambridge.org/')
          ? 'cambridge'
          : 'wiktionary',
    },
  ]),
)

export function dictionaryEntries() {
  return entries.values()
}

export function normalizedHeadword(input: string) {
  const word = input
    .trim()
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
  return word.length <= 64 &&
    /^[a-zà-öø-ÿ]+(?:['-][a-zà-öø-ÿ]+)*(?: [a-zà-öø-ÿ]+(?:['-][a-zà-öø-ÿ]+)*){0,4}$/.test(
      word,
    )
    ? word
    : undefined
}

export function pronunciationQuestion(text: string) {
  const query = text
    .trim()
    .replace(/^(?:hi|hello|hey)(?:,? buddy)?[!.]\s+/i, '')
    .replace(/[!?.,]+$/, '')
    .trim()
  const meaning = query.match(/^what does (.+?) mean$/i)?.[1]
  const direct =
    query.match(/^how (?:is|are) (.+?) pronounced$/i)?.[1] ?? meaning
  const english =
    /^(?:how (?:do (?:you|i) pronounce|to pronounce)|(?:please )?(?:(?:can|could|would) you )?(?:tell me how to )?pronounce|(?:show (?:me )?|what(?:['’]s| is) )?(?:the )?(?:british |uk )?(?:ipa(?: transcription)?|pronunciation) (?:of|for)|translate)\s+/i
  const russian =
    /^(?:как (?:правильно )?(?:произносится|произнести|переводится|перевести)|произнеси|переведи|что значит|(?:британская )?транскрипция|ipa)(?: по-британски)?\s+/i
  const prefix = query.match(english) ?? query.match(russian)
  const target = direct ?? (prefix && query.slice(prefix[0].length))
  if (!target) return
  const word = normalizedHeadword(
    target
      .replace(/^(?:(?:the )?word|слово|слова)\s+/i, '')
      .replace(
        /,?\s+(?:please|in (?:russian|british english|the uk)|по-британски|на (?:русский|британском английском))$/i,
        '',
      )
      .replace(/^["“«‘']+|["”»’']+$/g, ''),
  )
  if (
    (meaning ||
      /^(?:translate|переведи|что значит|как (?:правильно )?переводится|как (?:правильно )?перевести)\s/iu.test(
        query,
      )) &&
    word &&
    !britishPronunciation(word).forms.length
  )
    return undefined
  return word
}

export function britishPronunciation(word: string): BritishPronunciation {
  const key = word.toLowerCase()
  const entry = entries.get(key === 'cafe' ? 'café' : key)
  return (
    entry ?? {
      word,
      forms: [],
      url: `https://dictionary.cambridge.org/search/english/direct/?q=${encodeURIComponent(word)}`,
    }
  )
}
