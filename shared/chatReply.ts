import { containsContact } from './lessons'
import type { ChatRequest, Message } from './lessons'

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
  /^(?:i(?:['’]m| am) buddy|my name is buddy|this is buddy)\b\s*[,!:.–-]?\s*(?:and\s+)?/i
const greeting = /^(?:hello|hi|hey)(?: there)?(?=[\s,!.?]|$)[\s,!.?]*/i
const socialFiller =
  /^(?:i(?:['’]m| am) (?:so |very |really )?(?:happy|glad|excited) to (?:see|meet|talk to) you|i(?:['’]m| am) here to (?:help|chat with) you(?:\b.*)?|what would you like to talk about|how(?:['’]s| is) everything going)[.!?]?$/i
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
export const requestedFavourite = (text: string) =>
  text
    .match(/\b(?:what|which) ([a-z]+) do you (?:like|prefer)\b/i)?.[1]
    .toLowerCase()

function trimOpener(sentence: string, keepGreeting = false) {
  const trimmed = sentence
    .replace(greeting, '')
    .replace(introduction, '')
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
          words(trimOpener(sentence)),
        ),
      )
      .filter((line) => line.split(' ').length >= 4),
  )

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
    const clean = pieces
      .flatMap((sentence) => {
        const line = solicited ? sentence : trimOpener(sentence, isGreeting)
        const key = words(line)
        if (!key) return !partial && !words(sentence) ? [sentence] : []
        if (
          (!solicited && earlier.has(key)) ||
          unique.has(key) ||
          (copiedLearner.length >= 16 && copiedLearner === key)
        )
          return []
        unique.add(key)
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
      !/\b(?:repeat(?:ed|ing)?|same|sorry|again|mistake|stuck)\b/i.test(clean)
    )
      return undefined
    return clean
  }
}
