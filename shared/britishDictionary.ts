export type BritishForm = {
  ipa: string
  sense?: 'base' | 'past' | 'verb' | 'noun'
}
export type BritishPronunciation = {
  word: string
  forms: BritishForm[]
  url: string
}

const cambridge = 'https://dictionary.cambridge.org'

// Short UK headword transcriptions checked against the linked Cambridge pages.
// A superscript r marks linking r in Cambridge's notation.
const words: Record<string, string> = {
  apple: 'ˈæp.əl',
  banana: 'bəˈnɑː.nə',
  bath: 'bɑːθ',
  better: 'ˈbet.əʳ',
  book: 'bʊk',
  car: 'kɑːʳ',
  colour: 'ˈkʌl.əʳ',
  comfortable: 'ˈkʌm.fə.tə.bəl',
  crocodile: 'ˈkrɒk.ə.daɪl',
  dance: 'dɑːns',
  favourite: 'ˈfeɪ.vər.ɪt',
  football: 'ˈfʊt.bɔːl',
  hello: 'heˈləʊ',
  kangaroo: 'ˌkæŋ.ɡərˈuː',
  octopus: 'ˈɒk.tə.pəs',
  panda: 'ˈpæn.də',
  pencil: 'ˈpen.səl',
  pronunciation: 'prəˌnʌn.siˈeɪ.ʃən',
  route: 'ruːt',
  schedule: 'ˈʃedʒ.uːl',
  teacher: 'ˈtiː.tʃəʳ',
  thought: 'θɔːt',
  through: 'θruː',
  timetable: 'ˈtaɪmˌteɪ.bəl',
  tomato: 'təˈmɑː.təʊ',
  water: 'ˈwɔː.təʳ',
  world: 'wɜːld',
}

const variants: Record<string, BritishForm[]> = {
  either: [{ ipa: 'ˈaɪ.ðəʳ' }, { ipa: 'ˈiː.ðəʳ' }],
  often: [{ ipa: 'ˈɒf.ən' }, { ipa: 'ˈɒf.tən' }],
  read: [
    { ipa: 'riːd', sense: 'base' },
    { ipa: 'red', sense: 'past' },
  ],
  record: [
    { ipa: 'rɪˈkɔːd', sense: 'verb' },
    { ipa: 'ˈrek.ɔːd', sense: 'noun' },
  ],
}

export function normalizedHeadword(input: string) {
  const word = input
    .trim()
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
  return word.length <= 64 &&
    /^[a-z]+(?:['-][a-z]+)*(?: [a-z]+(?:['-][a-z]+)*){0,4}$/.test(word)
    ? word
    : undefined
}

export function pronunciationQuestion(text: string) {
  const query = text
    .trim()
    .replace(/[!?.,]+$/, '')
    .trim()
  const first = query.match(/^how (?:is|are) (.+?) pronounced$/i)?.[1]
  const english =
    /^(?:how (?:do (?:you|i) pronounce|to pronounce)|(?:please )?(?:(?:can|could|would) you )?pronounce|(?:show (?:me )?|what(?:['’]s| is) )?(?:the )?(?:british |uk )?(?:ipa(?: transcription)?|pronunciation) (?:of|for))\s+/i
  const russian =
    /^(?:как (?:правильно )?(?:произносится|произнести)|произнеси|(?:британская )?транскрипция|ipa)(?: по-британски)?\s+/i
  const prefix = query.match(english) ?? query.match(russian)
  let target = first ?? (prefix && query.slice(prefix[0].length))
  if (!target) return
  target = target
    .replace(/^(?:(?:the )?word|слово|слова)\s+/i, '')
    .replace(
      /\s+(?:please|in (?:british english|the uk)|по-британски|на британском английском)$/i,
      '',
    )
    .replace(/^["“«‘']+|["”»’']+$/g, '')
  return normalizedHeadword(target)
}

export function britishPronunciation(word: string): BritishPronunciation {
  const forms = Object.hasOwn(variants, word)
    ? variants[word]
    : Object.hasOwn(words, word)
      ? [{ ipa: words[word] }]
      : []
  const url = forms.length
    ? `${cambridge}/pronunciation/english/${encodeURIComponent(word)}`
    : `${cambridge}/search/english/direct/?q=${encodeURIComponent(word)}`
  return { word, forms, url }
}
