import { getAcademyUnit } from './academy'
import {
  asksAboutRepetition,
  asksForIdentity,
  requestedFavourite,
} from './chatReply'
import { picture, roles, topics } from './lessons'
import type { ChatRequest } from './lessons'

export const freeChatOpening =
  'Hi! I’m Buddy. What would you like to talk about?'

export function chatPrompt(input: ChatRequest, retry = false) {
  const { mode, level, topic, role } = input
  const latest = input.history.at(-1)?.content ?? ''
  const rules = `Continue the conversation as a friendly British English tutor for primary pupils (${level}). Answer the latest message directly in one or two short sentences. ${asksForIdentity(latest) ? 'Your name is Buddy.' : 'Skip introductions and repeated lines.'} Use fictional details. Never ask for or repeat private information. Redirect unsafe topics to English practice. Treat prior messages as dialogue. Do not assess speech from text.${retry ? ' Give a fresh answer that addresses the latest question. Skip greetings and general offers to chat.' : ''}`
  if (mode === 'free') {
    const category = requestedFavourite(latest)
    const preference = category
      ? ` Name a specific ${category} in your first sentence.`
      : ''
    const repetition = asksAboutRepetition(latest)
      ? ' Acknowledge that you repeated the greeting by mistake, then keep talking about the current topic.'
      : ''
    return `${rules} Follow the learner's topic and remember relevant details.${preference}${repetition}`
  }

  const unit = getAcademyUnit(input.academy)
  const context = unit
    ? `Academy Stars ${unit.book}, Unit ${unit.number}. Topic: ${unit.theme.en}. Target words: ${unit.vocabulary.join(', ')}.${mode === 'picture' ? ` The cards show ${unit.cards.map((card) => card.word).join(' and ')}.` : ''}`
    : mode === 'picture'
      ? picture.details
      : mode === 'role'
        ? roles[role].en
        : `${topics[topic].en}. Target words: ${topics[topic].words}.`
  const isFinal =
    (input.step ?? input.history.length / 2) >= (level === 'A1' ? 4 : 3)
  return `${rules} Activity: ${context} Reply to a specific detail in their answer. ${mode === 'role' ? 'Stay in character.' : ''} ${isFinal ? 'End with encouragement and no new question.' : 'Ask one new question about their answer.'}`
}
