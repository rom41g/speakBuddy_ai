import { getAcademyUnit } from './academy'
import type { AcademyBook } from './academy'
import type { ChatRequest, Level } from './lessons'

export const academyLevels: Record<AcademyBook, Level> = {
  1: 'Pre-A1',
  2: 'Pre-A1',
  3: 'A1',
  4: 'A1',
}

const bands = {
  1: {
    grammar: 'Use the simple present, have or can. Use very common words.',
    sentenceWords: 7,
    replyWords: 13,
    tokens: 26,
  },
  2: {
    grammar: 'Use the simple present, there is/are and short phrases about routines.',
    sentenceWords: 9,
    replyWords: 17,
    tokens: 32,
  },
  3: {
    grammar: 'Use everyday English and simple past when talking about the past.',
    sentenceWords: 11,
    replyWords: 21,
    tokens: 40,
  },
  4: {
    grammar: 'Use the simple present or past. You can give a short reason with because or a plan with going to.',
    sentenceWords: 13,
    replyWords: 24,
    tokens: 47,
  },
} satisfies Record<AcademyBook, {
  grammar: string
  sentenceWords: number
  replyWords: number
  tokens: number
}>

export function chatLevel(input: ChatRequest) {
  const book = getAcademyUnit(input.academy)?.book ?? input.book
  const level = book ? academyLevels[book] : input.level
  const band = bands[book ?? (level === 'Pre-A1' ? 1 : 3)]
  return { book, level, ...band }
}
