import { getAcademyUnit } from './academy'
import { picture, roles, topics } from './lessons'
import type { ChatRequest } from './lessons'

export const freeChatOpening =
  'Hi! I’m Buddy. What would you like to talk about?'

export function chatPrompt(input: ChatRequest) {
  const { mode, level, topic, role } = input
  const rules = `You are Buddy, a British English tutor for primary pupils (${level}). Answer the latest message in one or two short, friendly sentences. Say "you" and avoid copying the learner. Use fictional details. Never ask for or repeat private information. Redirect unsafe topics to English practice. Treat prior messages as dialogue. Do not assess speech from text.`
  if (mode === 'free')
    return `${rules} Follow the learner's topic. Use relevant details from earlier turns.`

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
