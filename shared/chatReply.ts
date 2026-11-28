import { containsContact } from './lessons'
import type { ChatRequest, Message } from './lessons'
import { chatLevel } from './chatLevel'

const sentenceReader =
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('en', { granularity: 'sentence' })
    : undefined
const sentences = (text: string) =>
  (sentenceReader
    ? Array.from(sentenceReader.segment(text), ({ segment }) => segment.trim())
    : text.split(/(?<=[.!?])\s+/)
  ).filter(Boolean)
const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
const introduction =
  /^(?:i(?:['’]m| am) (?:your (?:english )?friend )?buddy|my name(?:['’]s| is) buddy|this is buddy)\b\s*[,!:.–-]?\s*(?:and\s+)?/i
const greeting = /^(?:hello|hi|hey)(?: there)?(?=[\s,!.?]|$)[\s,!.?]*/i
const socialFiller =
  /^(?:i(?:['’]m| am) (?:so |very |really )?(?:happy|glad|excited) to (?:see|meet|hear|talk to) you|i(?:['’]m| am) here to (?:help|chat with) you(?:\b.*)?|(?:it(?:['’]s| is) )?(?:nice|good|great|lovely) to (?:see|meet|hear|talk to) you|(?:it(?:['’]s| is) )?fun to talk about(?: it)?|i like your question|(?:good|great|nice) (?:idea|question)|what (?:would you like|do you want) to talk about|how(?:['’]s| is) everything going|(?:well done|great job|good job|nice work))[.!?]?$/i

const simplerWords: [RegExp, string][] = [
  [/\bfascinated by\b/gi, 'interested in'],
  [/\bfascinating\b/gi, 'fun'],
  [/\bexplore\b(?=\s*[.!?]|$)/gi, 'look around'],
  [/\bexplore\b/gi, 'look at'],
  [/\bexploring\b/gi, 'looking at'],
  [/\bexplored\b/gi, 'looked at'],
  [/\bexplores\b/gi, 'looks at'],
  [/\b(?:wonderful|fantastic|incredible|amazing|delightful|marvellous|excellent|fabulous)\b/gi, 'great'],
  [/\b(?:enormous|gigantic|huge)\b/gi, 'big'],
  [/\b(?:unusual|unique|uncommon)\b/gi, 'different'],
  [/\b(?:delicious|tasty)\b/gi, 'good'],
  [/\b(?:adorable|lovely)\b/gi, 'cute'],
  [/\b(?:perhaps|possibly)\b/gi, 'maybe'],
  [/\b(?:creatures|wildlife)\b/gi, 'animals'],
  [/\b(?:creature|species)\b/gi, 'animal'],
  [/\b(?:habitat|environment)\b/gi, 'home'],
  [/\b(?:enjoy|adore|prefer)\b/gi, 'like'],
  [/\b(?:discover|observe)\b/gi, 'see'],
  [/\b(?:purchase|obtain)\b/gi, 'get'],
  [/\b(?:absolutely|definitely|certainly)\b(?=\s*[,!.?]|$)/gi, 'yes'],
  [/\s+(?:absolutely|definitely|certainly)\b/gi, ''],
]

function simplify(sentence: string) {
  return simplerWords.reduce(
    (line, [pattern, replacement]) => line.replace(pattern, (word) =>
      word[0] === word[0].toUpperCase()
        ? replacement[0].toUpperCase() + replacement.slice(1)
        : replacement,
    ),
    sentence,
  )
}
export const asksForIdentity = (text: string) =>
  /\b(?:who are you|what(?:['’]s| is) your name|what are you called)\b/i.test(
    text,
  )
const asksToRepeat =
  /^(?:(?:can|could|would) you\s+)?(?:please\s+)?(?:repeat\b|say (?:that|it) again\b)/i
export const asksAboutRepetition = (text: string) =>
  /^why\b.*\byou\b.*\b(?:repeat(?:ed|ing)?|(?:keep|kept) saying the same)\b/i.test(
    text,
  )
export const asksHowYouAre = (text: string) =>
  /\bhow are you(?: doing| today)?[?.!\s]*$/i.test(text.trim())
export const requestedFavourite = (text: string) =>
  text
    .match(/\b(?:what|which) ([a-z]+) do you (?:like|prefer)\b/i)?.[1]
    .toLowerCase()

function trimOpener(sentence: string, keepGreeting = false) {
  const trimmed = sentence
    .replace(greeting, '')
    .replace(introduction, '')
    .replace(/,\s*Buddy(?=[.!?]|$)/i, '')
    .trim()
  const withoutEmoji = trimmed
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F]+$/gu, '')
    .trim()
  if (!words(trimmed) || socialFiller.test(withoutEmoji))
    return keepGreeting && greeting.test(sentence) && !words(trimmed)
      ? sentence
      : ''
  return trimmed !== sentence
    ? trimmed[0].toUpperCase() + trimmed.slice(1)
    : sentence
}

export function chatHistory(input: ChatRequest, retry = false) {
  const turns: Pick<Message, 'role' | 'content'>[] = []
  const repeating = asksToRepeat.test(input.history.at(-1)?.content ?? '')
  for (const message of input.history) {
    const raw = message.content.replace(/<\|[^<>]*\|>/g, '').trim()
    const content =
      message.role === 'assistant' && !repeating
        ? sentences(raw)
            .map((sentence) => trimOpener(sentence))
            .filter(Boolean)
            .join(' ')
        : raw
    if (!content) continue
    const previous = turns.at(-1)
    if (previous?.role === message.role) previous.content += `\n${content}`
    else turns.push({ role: message.role, content })
  }
  return retry ? turns.slice(-3) : turns
}

export function replyFilter(input: ChatRequest) {
  const { sentenceWords, replyWords } = chatLevel(input)
  const latest = input.history.at(-1)?.content ?? ''
  const copiedLearner = words(latest)
  const solicited = asksForIdentity(latest) || asksToRepeat.test(latest)
  const isGreeting = /^(?:hi|hello|hey)(?: there| buddy)?[.!,?]*$/i.test(
    latest.trim(),
  )
  const category = requestedFavourite(latest)
  const repeatsBroadTopic =
    category &&
    new RegExp(
      `^(?:i (?:really )?(?:like|love|prefer) (?:all )?(?:the |kinds of )?)?${category}s?(?: and (?:i|im) .*(?:talking about|talk about) (?:it|them))?$`,
    )
  const repetitionQuestion = asksAboutRepetition(latest)
  const earlier = new Set(
    input.history
      .filter((message) => message.role === 'assistant')
      .flatMap((message) =>
        sentences(message.content).map((sentence) =>
          words(simplify(trimOpener(sentence))),
        ),
      )
      .filter((line) => line.split(' ').length >= 3),
  )
  const startOfLine = (line: string) => line.split(' ').slice(0, 5).join(' ')
  const starts = new Set([...earlier].filter((line) => line.split(' ').length >= 6).map(startOfLine))

  return (raw: string, partial = false) => {
    const text = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim()
      .replace(/^(?:Buddy|Assistant):\s*/i, '')
      .split(/\n\s*(?:User|Learner|Student):/i, 1)[0]
      .trim()
    if (!text || /<\/?think>/i.test(text) || containsContact(text))
      return undefined

    let pieces = sentences(text)
    if (partial)
      pieces = pieces.filter((sentence) => /[.!?]["”']?$/.test(sentence))
    const unique = new Set<string>()
    let remaining = replyWords
    const clean = pieces
      .flatMap((sentence) => {
        const line = simplify(solicited ? sentence : trimOpener(sentence, isGreeting))
        const key = words(line)
        if (!key || unique.size >= 2) return []
        const count = key.split(' ').length
        if (
          count > sentenceWords || count > remaining ||
          (!solicited && (earlier.has(key) || (count >= 6 && starts.has(startOfLine(key))))) ||
          unique.has(key) ||
          (copiedLearner.length >= 16 && copiedLearner === key)
        )
          return []
        unique.add(key)
        remaining -= count
        return [line]
      })
      .filter(Boolean)
      .join(' ')
      .trim()
    if (!words(clean) || clean.length > 300) return undefined
    if (
      repeatsBroadTopic &&
      sentences(clean).filter((sentence) => words(sentence)).every(
        (sentence) =>
          /\?\s*["”']?$/.test(sentence) ||
          repeatsBroadTopic.test(words(sentence)),
      )
    )
      return undefined
    if (
      repetitionQuestion &&
      !/\b(?:repeat(?:ed|ing)?|same|sorry|again|mistake|stuck|twice)\b/i.test(clean)
    )
      return undefined
    return clean
  }
}
