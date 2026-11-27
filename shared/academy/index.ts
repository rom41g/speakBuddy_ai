import { book1 } from './book1'
import { book2 } from './book2'
import { book3 } from './book3'
import { book4 } from './book4'
import { academyBooks } from './types'
import type { AcademyBook, AcademyUnit, UnitContent, WordCard } from './types'
import type { Mode } from '../lessons'

export { academyBooks }
export type { AcademyBook, AcademyUnit, WordCard } from './types'

const content: Record<AcademyBook, readonly UnitContent[]> = {
  1: book1,
  2: book2,
  3: book3,
  4: book4,
}

const units = academyBooks.flatMap((book) =>
  content[book].map((unit, index): AcademyUnit => ({
    ...unit,
    id: `${book}-${index + 1}`,
    book,
    number: index + 1,
  })),
)

const unitsById = new Map(units.map((unit) => [unit.id, unit]))

export function getAcademyUnit(id: string | null | undefined) {
  return typeof id === 'string' ? unitsById.get(id) : undefined
}

export function academyUnitsFor(book: AcademyBook) {
  return units.filter((unit) => unit.book === book)
}

export function academyLesson(mode: Mode, unit: AcademyUnit) {
  if (mode === 'picture') {
    const [first, second] = unit.cards
    return {
      question: 'Look at the two picture cards. What do they show?',
      hint: 'The first picture shows … The second picture shows …',
      next: [
        'Tell me one thing about each picture.',
        `Can you make a sentence with “${first.word}” or “${second.word}”?`,
        'Can you use both words to tell a short story?',
      ],
    }
  }
  const activity = mode === 'role' ? unit.role : unit.conversation
  return {
    question: activity.question,
    hint: unit.example.text,
    next: [
      activity.followUp,
      mode === 'role'
        ? 'What would you say next in our scene?'
        : unit.conversation.challenge,
      'Can you add one more detail?',
    ],
  }
}

export function academyPronunciations(unit: AcademyUnit) {
  const tip = unit.cards[0].word
  return {
    sentence: { ...unit.example, tip },
    word: { ...unit.example, text: tip, ru: '', tip },
  }
}

export function academyGuess(card: WordCard, input: string, turn: number) {
  const normalized = input.toLowerCase().replace(/[’']/g, '').trim()
  const guess = normalized
    .replace(
      /^(?:is it|is the word|its|it is|i guess|i think its|i think it is|the word is)\s+/,
      '',
    )
    .replace(/^(?:a|an|the)\s+/, '')
    .replace(/[.?!]+$/, '')
    .trim()
  if (guess === card.word.toLowerCase()) {
    return {
      content: `Yes! The answer is “${card.word}”. Well done!`,
      done: true,
    }
  }
  if (turn >= 6) {
    return {
      content: `The answer was “${card.word}”. Thanks for playing!`,
      done: true,
    }
  }
  if (/first letter|start(?:s)? with|begin(?:s)? with/.test(normalized)) {
    return {
      content: `It starts with ${card.word[0].toUpperCase()}. ${card.clue}`,
      done: false,
    }
  }
  return { content: `Try again. ${card.clue}`, done: false }
}
