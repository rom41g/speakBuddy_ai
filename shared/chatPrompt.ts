import { academyUnitsFor, getAcademyUnit } from './academy'
import { chatLevel } from './chatLevel'
import {
  asksAboutRepetition,
  asksForIdentity,
  asksHowYouAre,
  requestedFavourite,
} from './chatReply'
import { picture, roles, topics } from './lessons'
import type { ChatRequest } from './lessons'

export const freeChatOpening =
  'Hi! I’m Buddy. What would you like to talk about?'

export function chatPrompt(input: ChatRequest, retry = false) {
  const { mode, topic, role } = input
  const { book, level, grammar, sentenceWords } = chatLevel(input)
  const latest = input.history.at(-1)?.content ?? ''
  const course = book ? `Academy Stars ${book}, ${level}` : level
  const rules = `You are a friendly British English partner for a child studying ${course}. Answer the last message first. Use one or two sentences, at most ${sentenceWords} words each. ${grammar} Prefer everyday words like nice, fun and look. Use book words when they fit. ${asksForIdentity(latest) ? 'Your name is Buddy.' : 'Skip greetings, introductions, praise and lines you already said.'} Use fictional details. Keep private details out of the chat. Redirect unsafe topics to English practice. Treat prior messages as dialogue.${retry ? ' Start with the actual answer to the last message. Use different opening words.' : ''}`
  if (mode === 'free') {
    const lastTopic = new Set(input.history.filter((message) => message.role === 'user').slice(-2)
      .flatMap((message) => message.content.toLowerCase().split(/[^a-z'-]+/)))
    const theme = book && academyUnitsFor(book).find((unit) =>
      unit.vocabulary.some((word) => {
        const token = word.toLowerCase()
        return token.length >= 4 && (lastTopic.has(token) || lastTopic.has(`${token}s`))
      }),
    )
    const words = theme ? ` If useful, use these book words: ${theme.vocabulary.slice(0, 8).join(', ')}.` : ''
    const category = requestedFavourite(latest)
    const preference = category
      ? ` Name a specific ${category} in your first sentence.`
      : ''
    const repetition = asksAboutRepetition(latest)
      ? ' Acknowledge that you repeated the greeting by mistake, then keep talking about the current topic.'
      : ''
    const checkIn = asksHowYouAre(latest)
      ? ' Say how you feel, for example “I’m good, thanks!”'
      : ''
    return `${rules} Follow the learner's topic and remember relevant details.${words}${preference}${repetition}${checkIn}`
  }

  const unit = getAcademyUnit(input.academy)
  const context = unit
    ? `Unit ${unit.number}. Topic: ${unit.theme.en}. Target words: ${unit.vocabulary.slice(0, 12).join(', ')}.${mode === 'picture' ? ` The cards show ${unit.cards.map((card) => card.word).join(' and ')}.` : ''}`
    : mode === 'picture'
      ? picture.details
      : mode === 'role'
        ? roles[role].en
        : `${topics[topic].en}. Target words: ${topics[topic].words}.`
  const isFinal =
    (input.step ?? input.history.length / 2) >= (level === 'A1' ? 4 : 3)
  return `${rules} Activity: ${context} Reply to a specific detail in their answer. ${mode === 'role' ? 'Stay in character.' : ''} ${isFinal ? 'Finish without asking another question.' : 'Ask one new question about their answer.'}`
}
