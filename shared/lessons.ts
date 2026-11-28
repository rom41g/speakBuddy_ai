import { academyLesson } from './academy'
import type { AcademyBook, AcademyUnit } from './academy'
import type { BritishPronunciation } from './britishDictionary'

export const topics = {
  animals: {
    en: 'Animals',
    ru: 'Животные',
    icon: '🦊',
    words: 'dog, cat, bear, rabbit, bird',
    question: 'What is your favourite animal?',
    hint: 'My favourite animal is a …',
    next: ['What colour is it?', 'What can it do?', 'Where does it live?'],
  },
  food: {
    en: 'Food',
    ru: 'Еда',
    icon: '🍎',
    words: 'apple, bread, milk, juice, banana',
    question: 'What food do you like?',
    hint: 'I like …',
    next: [
      'What do you like to drink?',
      'Do you like apples?',
      'What do you eat for breakfast?',
    ],
  },
  family: {
    en: 'Family',
    ru: 'Семья',
    icon: '🏡',
    words: 'mum, dad, sister, brother, grandma',
    question: 'Think of a story family. Who is in it?',
    hint: 'In my story, there is …',
    next: [
      'What do they like to do?',
      'Do they have a pet?',
      'What game do they play?',
    ],
  },
  school: {
    en: 'School',
    ru: 'Школа',
    icon: '🎒',
    words: 'book, pencil, classroom, lesson, draw',
    question: 'What do you like to do at school?',
    hint: 'At school, I like to …',
    next: [
      'What is in your school bag?',
      'What do you do after lunch?',
      'What is your favourite lesson?',
    ],
  },
  hobbies: {
    en: 'Hobbies',
    ru: 'Увлечения',
    icon: '⚽',
    words: 'play, draw, read, swim, dance',
    question: 'What do you like to do after school?',
    hint: 'I like to …',
    next: [
      'Do you do it with a friend?',
      'When do you do it?',
      'What else do you like to do?',
    ],
  },
  toys: {
    en: 'Toys',
    ru: 'Игрушки',
    icon: '🧸',
    words: 'ball, doll, teddy bear, kite, train',
    question: 'What is your favourite toy?',
    hint: 'My favourite toy is a …',
    next: [
      'What colour is it?',
      'Is it big or small?',
      'Where do you play with it?',
    ],
  },
} as const

export const roles = {
  shop: {
    en: 'At the shop',
    ru: 'В магазине',
    question: 'Hello! Welcome to my shop. What would you like?',
    hint: 'I would like an apple, please.',
    next: [
      'Here you are. Would you like anything else?',
      'Would you like a bag?',
      'Thank you! What do you say when you leave?',
    ],
  },
  cafe: {
    en: 'At the café',
    ru: 'В кафе',
    question: 'Hello! What would you like to drink?',
    hint: 'Can I have some juice, please?',
    next: [
      'Would you like something to eat?',
      'Would you like an apple or a banana?',
      'Here you are. What do you say?',
    ],
  },
  school: {
    en: 'Let’s meet!',
    ru: 'Знакомство в школе',
    question: 'Hi! I’m Sam. Choose a pretend name. What can I call you?',
    hint: 'You can call me Alex.',
    next: [
      'Nice to meet you! What do you like to do?',
      'Do you like to draw?',
      'It was nice to meet you. Can you say goodbye?',
    ],
  },
} as const

export const phrases = {
  bear: {
    text: 'I have a brown bear.',
    ru: 'У меня есть коричневый медведь.',
    tip: 'brown',
    ipa: '/aʊ/',
  },
  apple: {
    text: 'Can I have an apple, please?',
    ru: 'Можно мне яблоко, пожалуйста?',
    tip: 'apple',
    ipa: '/æ/',
  },
  school: {
    text: 'This is my school.',
    ru: 'Это моя школа.',
    tip: 'this',
    ipa: '/ð/',
  },
  football: {
    text: 'I like playing football.',
    ru: 'Мне нравится играть в футбол.',
    tip: 'football',
    ipa: '/ʊ/',
  },
} as const

export const picture = {
  question: 'Look at the park. What can you see?',
  hint: 'I can see a … The dog is …',
  next: [
    'What colour is the ball?',
    'What is the dog doing?',
    'Can you tell me about the park in a few sentences?',
  ],
  details:
    'A brown dog runs towards a red ball on green grass. There is a tree and a bench. The sky is blue.',
} as const

export type Topic = keyof typeof topics
export type Role = keyof typeof roles
export type Phrase = keyof typeof phrases
export type Mode = ChatMode | 'pronounce' | 'guess'
export type ChatMode = 'chat' | 'role' | 'picture' | 'free'
export type Level = 'Pre-A1' | 'A1'
export type Lang = 'ru' | 'en'
export type Message = {
  role: 'user' | 'assistant'
  content: string
  correction?: string
  source?: string
  pronunciation?: BritishPronunciation
  hint?: boolean
  voiceOnly?: boolean
}
export type ChatRequest = {
  mode: ChatMode
  topic: Topic
  role: Role
  level: Level
  history: Message[]
  academy?: string
  book?: AcademyBook
  step?: number
}

export function lesson(
  mode: Mode,
  topic: Topic,
  role: Role,
  academy?: AcademyUnit,
) {
  if (academy) return academyLesson(mode, academy)
  return mode === 'role'
    ? roles[role]
    : mode === 'picture'
      ? picture
      : topics[topic]
}

const corrections: [RegExp, string][] = [
  [
    /\bmy favou?rite animal is (dog|cat|bear|rabbit|bird)\b/i,
    'My favourite animal is a $1.',
  ],
  [/\bi have (dog|cat|bear|rabbit|bird|ball|book|pencil)\b/i, 'I have a $1.'],
  [/\bi like (play|draw|read|swim|dance)\b/i, 'I like to $1.'],
  [/\bi can see (dog|cat|ball|tree|bench)\b/i, 'I can see a $1.'],
  [/\bthere is (dog|cat|ball|tree|bench)\b/i, 'There is a $1.'],
  [/\bcan i have (apple|banana)\b/i, 'Can I have an $1, please?'],
]

export function grammarHint(input: string) {
  const correction = corrections.find(([pattern]) => pattern.test(input))
  const fixed =
    correction &&
    input.match(correction[0])?.[0].replace(correction[0], correction[1])
  return fixed === 'Can I have an banana, please?'
    ? 'Can I have a banana, please?'
    : fixed
}

export function containsContact(text: string) {
  return /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?=(?:\D*\d){7})[+\d][\d(). -]{6,}\d|https?:\/\/|www\.)/i.test(
    text,
  )
}
