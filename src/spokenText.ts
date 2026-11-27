const questionWord = /^(?:how|what|when|where|which|who|whose|why)\b/i
const questionVerb =
  /^(?:am|are|is|was|were|can|could|did|does|has|have|may|must|shall|should|will|would)\b/i
const doQuestion = /^do (?:i|you|we|they|it|the|a|an|any|all|\w+s\s+\w+)\b/i
const exclamation =
  /^(?:hello|hi|hey)(?:,? buddy)?$|^(?:wow|hooray|yay|oh no)\b|^what (?:a|an) .*\b(?:day|surprise|mess|shame|idea|pity|fun|beauty)$/i
const contractions: Record<string, string> = {
  im: "I'm",
  ive: "I've",
  youre: "you're",
  youve: "you've",
  dont: "don't",
  doesnt: "doesn't",
  didnt: "didn't",
  isnt: "isn't",
  arent: "aren't",
  wasnt: "wasn't",
  werent: "weren't",
  cant: "can't",
  couldnt: "couldn't",
  wont: "won't",
  wouldnt: "wouldn't",
  wouldntve: "wouldn't've",
  shouldnt: "shouldn't",
  havent: "haven't",
  hasnt: "hasn't",
  lets: "let's",
}

function endMark(text: string) {
  if (exclamation.test(text)) return '!'
  if (
    (questionWord.test(text) && !/^what (?:i|you|we|they)\b/i.test(text)) ||
    (questionVerb.test(text) &&
      !/^(?:have (?:a|fun|some)|may not)\b/i.test(text)) ||
    doQuestion.test(text) ||
    /,? (?:isn't it|don't you|can't you|right|is it|aren't they)$/i.test(text)
  )
    return '?'
  return '.'
}

export function formatSpokenText(transcript: string) {
  const raw = transcript.trim().replace(/\s+/g, ' ')
  if (!raw) return ''

  const text = raw
    .replace(/\bi\b/gi, 'I')
    .replace(
      /\b(?:im|ive|youre|youve|dont|doesnt|didnt|isnt|arent|wasnt|werent|cant|couldnt|wont|wouldnt|wouldntve|shouldnt|havent|hasnt|lets)\b/gi,
      (word) => contractions[word.toLowerCase()],
    )
    .replace(
      /\b(?:english|british|britain|england|scotland|wales|russia|india|australia|china|january|february|april|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|buddy)\b/gi,
      (word) => word[0].toUpperCase() + word.slice(1),
    )
    .replace(/^(hi|hello|hey),?\s+buddy\b(?![.!?])\s*/i, '$1, Buddy! ')
    .replace(
      /^(hi|hello|hey)(?:,)?\s+(?=(?:how|what|can|could|where|why|are|do|I)\b)/i,
      '$1! ',
    )
    .replace(
      /^(yes|no|well|oh no|wow|of course|thank you)(?:\s+)(?=(?:i|it|he|she|we|they|you|there|what|how|can|could|that)\b)/i,
      '$1, ',
    )
    .replace(/^((?:no|oh|okay|thanks))\s+(?=buddy\b)/i, '$1, ')
    .replace(
      /\s+(but|so)\s+(?=(?:i|you|he|she|we|they|it|there)\s+(?:\w|['’]))/gi,
      (match, _word, offset: number, line: string) =>
        line[offset - 1] === ',' ? match : `,${match}`,
    )
    .replace(
      /(?<!,)\s+(?=(?:isn't it|don't you|can't you|aren't they|didn't he)\s*[.?!]?$)/i,
      ', ',
    )
    .replace(/(?<!,)\s+(?=please\s*[.?!]?$)/i, ', ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim()

  const last = text.split(/(?<=[.?!])\s+/).at(-1) ?? text
  const punctuated = /[.?!]["”']?$/.test(last)
    ? text
    : `${text}${endMark(last.replace(/^(?:well|yes|no),\s*/i, ''))}`
  return punctuated.replace(
    /(^|[.?!]\s+)(["“']?)(\p{L})/gu,
    (_match, prefix: string, quote: string, letter: string) =>
      `${prefix}${quote}${letter.toUpperCase()}`,
  )
}
