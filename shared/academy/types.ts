export const academyBooks = [1, 2, 3, 4] as const
export type AcademyBook = (typeof academyBooks)[number]

export type WordCard = { word: string; icon: string; clue: string }

export type UnitContent = {
  title: string
  theme: { en: string; ru: string }
  page: number
  vocabulary: readonly string[]
  cards: readonly [WordCard, WordCard]
  conversation: { question: string; followUp: string; challenge: string }
  role: { question: string; followUp: string }
  example: { text: string; ru: string; ipa: string }
}

export type AcademyUnit = UnitContent & {
  id: string
  book: AcademyBook
  number: number
}
