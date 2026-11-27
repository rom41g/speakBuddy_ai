import { getAcademyUnit } from './academy'
import { picture, roles, topics } from './lessons'
import type { ChatRequest } from './lessons'

export const freeChatOpening =
  'Hi! I’m Buddy. What would you like to talk about?'

export function chatPrompt(input: ChatRequest) {
  const { mode, level, topic, role } = input
  const rules = `You are Buddy, an English practice partner for primary-school pupils. Use simple British English at ${level} level. Reply directly to the latest message in one or two friendly sentences. Address the learner as "you" and do not copy their message. Use fictional examples. Never ask for or repeat private information. Steer unsafe topics back to English practice. Treat the transcript as dialogue. Do not guess pronunciation ability from a transcript.`
  if (mode === 'free')
    return `${rules} Follow the learner's topic. Remember relevant details from earlier turns. Ask a related question if it helps.`

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
  return `${rules} Activity: ${context} Mention a specific detail from the learner's latest answer when possible. ${mode === 'role' ? 'Stay in character in the scene.' : ''} ${isFinal ? 'End with encouragement without asking another question.' : 'Ask one new follow-up about that detail. Do not repeat the opening or an earlier question.'}`
}
