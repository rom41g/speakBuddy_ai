import { getAcademyUnit } from './academy'
import { chatLevel } from './chatLevel'
import {
  asksAboutRepetition,
  asksBack,
  asksForHelp,
  asksForIdentity,
  asksHowYouAre,
  requestedFavourite,
} from './chatReply'
import { lesson, picture, roles, topics } from './lessons'
import type { ChatRequest } from './lessons'

export const freeChatOpening =
  'Hi! I’m Buddy. What would you like to talk about?'

export function chatPrompt(input: ChatRequest, retry = false) {
  const { mode, topic, role } = input
  const { book, level, grammar, sentenceWords } = chatLevel(input)
  const latest = input.history.at(-1)?.content ?? ''
  const course = book ? `Academy Stars ${book}, ${level}` : level
  if (mode === 'free') {
    const identity = asksForIdentity(latest)
      ? ' The learner is asking for your name. Your name is Buddy.'
      : ''
    const category = requestedFavourite(latest)
    const preference = category
      ? ` Name a specific ${category} in your first sentence.`
      : ''
    const repetition = asksAboutRepetition(latest)
      ? ' Acknowledge that you repeated the greeting by mistake, then keep talking about the current topic.'
      : ''
    const checkIn = asksHowYouAre(latest) ? ' Say how you feel.' : ''
    return `You are Buddy, a friendly British English chat partner for a child at ${course}. Answer the learner’s latest message directly. Follow their topic. If they ask what you mean, explain your last reply in simpler words. Ask what they need if their request is unclear. Use one or two sentences of at most ${sentenceWords} words each. ${grammar} Skip repeated greetings. Use fictional details, keep private details out, and redirect unsafe topics to English practice.${identity}${preference}${repetition}${checkIn}${retry ? ' Give a fresh, direct reply.' : ''}`
  }

  const unit = getAcademyUnit(input.academy)
  const activity = lesson(mode, topic, role, unit)
  const context = unit
    ? `Unit ${unit.number}. Topic: ${unit.theme.en}. Target words: ${unit.vocabulary.slice(0, 12).join(', ')}.${mode === 'picture' ? ` The cards show ${unit.cards.map((card) => card.word).join(' and ')}.` : ''}`
    : mode === 'picture'
      ? picture.details
      : mode === 'role'
        ? roles[role].en
        : `${topics[topic].en}. Target words: ${topics[topic].words}.`
  const isFinal =
    (input.step ?? input.history.length / 2) >= (level === 'A1' ? 4 : 3)
  const response = asksForHelp(latest)
    ? `The pupil wants help answering. Give one short example they can say, such as ${JSON.stringify(activity.hint)}.`
    : asksBack(latest)
      ? 'The pupil asks the same question back. Answer about yourself and start with "I".'
      : 'Respond to one detail in the pupil’s reply. Answer any question they ask.'
  return `You are Buddy, a British English tutor. Continue a ${course} exercise. Activity: ${context} You opened with ${JSON.stringify(activity.question)}. Use your latest question to understand short answers. ${response} Use one or two short sentences of at most ${sentenceWords} words each. ${grammar} Skip greetings and repeated lines. Use fictional details, keep private details out and redirect unsafe topics to English practice. ${mode === 'role' ? 'Stay in character. ' : ''}${isFinal ? 'Finish without another question.' : 'You can ask one short question about their answer.'}${retry ? ' Give a fresh reply.' : ''}`
}
