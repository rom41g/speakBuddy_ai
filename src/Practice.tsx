import { useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  Lightbulb,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { academyGuess } from '../shared/academy'
import type { AcademyUnit } from '../shared/academy'
import {
  freeChatOpening,
  freePreparedReply,
  guidedInterruption,
  socialReply,
} from '../shared/conversation'
import {
  containsContact,
  lesson,
  picture,
  scriptReply,
  topics,
} from '../shared/lessons'
import type {
  ChatRequest,
  Level,
  Message,
  Mode,
  Role,
  Topic,
} from '../shared/lessons'
import { api } from './api'
import {
  browserChat,
  browserModelAvailability,
  enableBrowserModel,
} from './browserChat'
import type { ModelAvailability } from './browserChat'
import type { Progress, Translate } from './App'
import {
  playbackMessage,
  speak,
  SpeechRecognition,
  stopSpeaking,
} from './speech'
import type { PlaybackStatus } from './speech'

const animals = [
  {
    name: 'cat',
    traits: ['small', 'pet', 'tail', 'fur', 'jump', 'run', 'meow'],
    hint: 'It says meow.',
  },
  {
    name: 'dog',
    traits: ['pet', 'tail', 'fur', 'run', 'jump', 'bark'],
    hint: 'It says woof.',
  },
  {
    name: 'rabbit',
    traits: ['small', 'pet', 'tail', 'fur', 'long ears', 'jump', 'run'],
    hint: 'It has long ears.',
  },
  {
    name: 'bear',
    traits: ['big', 'tail', 'fur', 'run', 'swim'],
    hint: 'It is big and can be brown.',
  },
]

function guessReply(
  animal: (typeof animals)[number],
  input: string,
  turn: number,
) {
  const normalized = input.toLowerCase().replace(/[’']/g, '').trim()
  const guess = normalized.match(
    /^(?:(?:is it|its|it is|i guess|i think its|i think it is)\s+)?(?:a |an |the )?(cat|dog|rabbit|bear|bird|fox|lion|fish|elephant|tiger|horse|pig|cow|mouse)\s*[.?!]*$/,
  )?.[1]
  if (guess === animal.name)
    return { content: `Yes! It is a ${animal.name}. Well done!`, done: true }
  if (turn >= 6)
    return { content: `Good questions! It was a ${animal.name}.`, done: true }
  if (guess)
    return { content: `Good guess! Try again. ${animal.hint}`, done: false }
  const trait = [
    ...new Set(
      animals.flatMap((item) => item.traits).concat(['fly', 'wings', 'swim']),
    ),
  ].find((item) => new RegExp(`\\b${item}\\b`).test(normalized))
  if (trait) {
    const yes = animal.traits.includes(trait)
    return {
      content: `${yes ? 'Yes.' : 'No.'} ${turn >= 3 ? animal.hint : 'Ask me another question!'}`,
      done: false,
    }
  }
  return {
    content:
      `Try asking, “Can it jump?” ${turn >= 2 ? animal.hint : ''}`.trim(),
    done: false,
  }
}

type Props = {
  mode: Exclude<Mode, 'pronounce'>
  academy?: AcademyUnit
  topic: Topic
  role: Role
  level: Level
  t: Translate
  hints: boolean
  autoSpeak: boolean
  changeAutoSpeak(enabled: boolean): void
  access: string
  report(change: Partial<Progress>): void
  restart(): void
}

export default function Practice({
  mode,
  academy,
  topic,
  role,
  level,
  t,
  hints,
  autoSpeak,
  changeAutoSpeak,
  access,
  report,
  restart,
}: Props) {
  const open = mode === 'free'
  const activity = lesson(mode, topic, role, academy)
  const [draw] = useState(() => Math.random())
  const animal = animals[Math.floor(draw * animals.length)]
  const card = academy?.cards[Math.floor(draw * academy.cards.length)]
  const question = open
    ? freeChatOpening
    : mode === 'guess'
      ? card
        ? `Guess the word! ${card.clue}`
        : 'I am thinking of an animal. Ask me a question!'
      : activity.question
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: question },
  ])
  const [turn, setTurn] = useState(0)
  const [lessonQuestion, setLessonQuestion] = useState(question)
  const [draft, setDraft] = useState('')
  const [voice, setVoice] = useState(false)
  const [listening, setListening] = useState(false)
  const [speechConsent, setSpeechConsent] = useState(false)
  const [showSpeechInfo, setShowSpeechInfo] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [finished, setFinished] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const [playback, setPlayback] = useState<PlaybackStatus>()
  const [availability, setAvailability] =
    useState<ModelAvailability>('unavailable')
  const [modelLoading, setModelLoading] = useState(false)
  const recognizer = useRef<InstanceType<
    NonNullable<typeof SpeechRecognition>
  > | null>(null)
  const mounted = useRef(false)
  const transcript = useRef<HTMLDivElement>(null)
  const localModel = useRef<AbortController | null>(null)
  const target = level === 'A1' ? 4 : 3

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stopSpeaking()
      const active = recognizer.current
      if (active) {
        active.onend = active.onerror = active.onresult = null
        active.abort()
      }
    }
  }, [])
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    localModel.current = controller
    browserModelAvailability().then((state) => {
      if (!controller.signal.aborted) setAvailability(state)
    })
    return () => controller.abort()
  }, [open])
  useEffect(() => {
    if (transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight
  }, [messages, pending])

  function listen(content: string) {
    speak(content, level === 'Pre-A1' ? 0.79 : 0.9, (status) => {
      if (mounted.current) setPlayback(status)
    })
  }

  async function connectBrowserModel() {
    const signal = localModel.current?.signal
    if (!signal || modelLoading) return
    setModelLoading(true)
    setError('')
    try {
      await enableBrowserModel(signal)
      if (!signal.aborted) setAvailability('available')
    } catch {
      if (!signal.aborted)
        setError(
          t(
            'Браузер не смог запустить локальный ИИ.',
            'The browser could not start its local model.',
          ),
        )
    } finally {
      if (!signal.aborted) setModelLoading(false)
    }
  }

  function startMic() {
    if (!SpeechRecognition || recognizer.current) return
    stopSpeaking()
    setError('')
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const result = event.results[0]?.[0]?.transcript.trim()
      if (result) {
        setDraft(result.slice(0, 300))
        setVoice(true)
      }
    }
    recognition.onerror = (event) => {
      if (event.error !== 'aborted')
        setError(
          t(
            'Распознавание не сработало. Попробуй ещё раз или напечатай ответ.',
            'Speech recognition failed. Try again or type your answer.',
          ),
        )
    }
    recognition.onend = () => {
      recognizer.current = null
      setListening(false)
    }
    try {
      recognizer.current = recognition
      recognition.start()
      setListening(true)
    } catch {
      recognizer.current = null
      setError(
        t('Не удалось запустить микрофон.', 'Could not start the microphone.'),
      )
    }
  }

  async function submit() {
    const text = draft.trim()
    if (!text || pending || finished || listening) return
    if (containsContact(text)) {
      setError(
        t(
          'Попробуй ответить без номера телефона, адреса почты или ссылки.',
          'Try a reply without a phone number, email address or link.',
        ),
      )
      return
    }
    stopSpeaking()
    setPlayback(undefined)
    setError('')
    setDraft('')
    setVoice(false)
    const history: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(history)
    report({ turns: 1, voice: voice ? 1 : 0 })
    let done = false
    let reply: Message
    const interruption = open
      ? socialReply(text)
      : mode !== 'guess' && guidedInterruption(text, lessonQuestion)
    const step = turn + 1

    if (interruption) {
      reply = { role: 'assistant', content: interruption }
    } else if (mode === 'guess') {
      const result = card
        ? academyGuess(card, text, step)
        : guessReply(animal, text, step)
      done = result.done
      reply = { role: 'assistant', content: result.content }
    } else {
      done = !open && step >= target
      reply = open
        ? {
            role: 'assistant',
            content: freePreparedReply(
              text,
              messages[messages.length - 1].content,
            ),
          }
        : scriptReply(mode, topic, role, text, step, target, academy)
      const browserReady = open && availability === 'available' && !modelLoading
      if (access || browserReady) {
        setPending(true)
        const recent = history.slice(-8)
        const payload: ChatRequest = {
          mode,
          topic,
          role,
          level,
          history: recent,
          academy: academy?.id,
          step: open ? undefined : step,
        }
        let generated: Message | undefined
        if (access) {
          generated = await api<Message>('chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Demo-Code': access,
            },
            body: JSON.stringify(payload),
          }).catch(() => undefined)
        }
        if (
          !generated &&
          browserReady &&
          localModel.current &&
          mounted.current
        ) {
          generated = await browserChat(
            recent,
            localModel.current.signal,
          ).catch(() => undefined)
        }
        if (!mounted.current) return
        setPending(false)
        if (generated) reply = generated
        else
          setError(
            t(
              'ИИ сейчас недоступен. Включён базовый режим.',
              'AI is unavailable. Basic mode is active.',
            ),
          )
      }
    }
    if (!mounted.current) return
    if (!open && !interruption) {
      setTurn(step)
      setLessonQuestion(reply.content)
    }
    setMessages([...history, reply])
    if (autoSpeak)
      listen([reply.content, reply.correction].filter(Boolean).join(' '))
    if (done) {
      setFinished(true)
      report({ finished: 1 })
    }
  }

  const audioStatus = playbackMessage(playback, t)

  return (
    <div className={`activity-layout ${mode === 'picture' ? 'split' : ''}`}>
      {mode === 'picture' && (
        <figure className="panel picture-panel">
          {academy ? (
            <div className="picture-cards">
              {academy.cards.map((item) => (
                <span
                  key={item.word}
                  role="img"
                  lang="en"
                  aria-label={item.clue}
                >
                  {item.icon}
                </span>
              ))}
            </div>
          ) : (
            <img
              src={`${import.meta.env.BASE_URL}park.webp`}
              alt={t(
                'В парке коричневая собака бежит к красному мячу. Рядом с деревом стоит скамейка.',
                picture.details,
              )}
            />
          )}
          <figcaption>
            {academy
              ? t(
                  'Опиши обе карточки словами юнита.',
                  'Describe both cards using words from the unit.',
                )
              : t(
                  level === 'A1'
                    ? 'Расскажи, что видишь. Попробуй составить 4–5 фраз.'
                    : 'Назови, что видишь. Добавь цвет или действие.',
                  level === 'A1'
                    ? 'Say what you see. Try four or five sentences.'
                    : 'Name what you see. Add a colour or an action.',
                )}
          </figcaption>
        </figure>
      )}
      <section
        className="panel chat-panel"
        aria-label={t('Диалог с Бадди', 'Chat with Buddy')}
      >
        <div className="chat-header">
          <span className="buddy-icon">
            <AudioLines size={21} />
          </span>
          <div>
            <strong>Buddy</strong>
            <p>
              {mode !== 'guess' && access
                ? t('ИИ-режим', 'AI mode')
                : open
                  ? availability === 'available'
                    ? t('ИИ в браузере', 'On-device AI')
                    : t('Базовый чат', 'Basic chat')
                  : t('Учебный сценарий', 'Prepared lesson')}
            </p>
          </div>
          <div className="chat-tools">
            {!open && (
              <span className="turns">
                {mode === 'guess' ? `${turn}/6` : `${turn}/${target}`}{' '}
                {t('реплик', 'replies')}
              </span>
            )}
            <button
              className="audio-toggle"
              type="button"
              aria-pressed={autoSpeak}
              onClick={() => {
                if (autoSpeak) {
                  stopSpeaking()
                  setPlayback(undefined)
                }
                changeAutoSpeak(!autoSpeak)
              }}
            >
              {autoSpeak ? <Volume2 size={17} /> : <VolumeX size={17} />}
              {t('Автоозвучка', 'Auto-play replies')}
            </button>
            {open && messages.length > 1 && (
              <button className="audio-toggle" onClick={restart}>
                <RotateCcw size={16} /> {t('Новый чат', 'New chat')}
              </button>
            )}
          </div>
        </div>
        {open &&
          !access &&
          (modelLoading ||
            availability === 'downloadable' ||
            availability === 'downloading') && (
            <div className="model-prompt">
              <span>
                {t(
                  'Браузер может скачать модель для свободного диалога.',
                  'Your browser can download a model for open conversation.',
                )}
              </span>
              <button
                className="secondary"
                disabled={modelLoading}
                onClick={connectBrowserModel}
              >
                {modelLoading
                  ? t('Загружаю модель…', 'Loading the model…')
                  : t('Включить ИИ в браузере', 'Enable on-device AI')}
              </button>
            </div>
          )}
        <div
          className="transcript"
          ref={transcript}
          role="log"
          aria-live="polite"
        >
          {messages.map((message, index) => (
            <div className={`turn ${message.role}`} key={index}>
              <div className="message" lang="en">
                {message.content}
                {message.correction && (
                  <p className="correction" lang={t('ru', 'en')}>
                    <Sparkles size={15} /> {t('Попробуй так', 'Try saying')}{' '}
                    <span lang="en">{message.correction}</span>
                  </p>
                )}
                {message.source && (
                  <small className="model-id">{message.source}</small>
                )}
              </div>
              {message.role === 'assistant' && (
                <button
                  className="icon-button"
                  aria-label={t('Озвучить реплику Бадди', 'Play Buddy’s reply')}
                  onClick={() =>
                    listen(
                      [message.content, message.correction]
                        .filter(Boolean)
                        .join(' '),
                    )
                  }
                >
                  <Volume2 size={19} />
                </button>
              )}
            </div>
          ))}
          {pending && (
            <p className="status">
              {t('Бадди готовит ответ…', 'Buddy is thinking…')}
            </p>
          )}
        </div>
        {audioStatus && (
          <p className="audio-status status" role="status">
            {audioStatus}
          </p>
        )}
        {finished ? (
          <div className="completion" role="status">
            <Star size={20} fill="currentColor" />
            <strong>{t('Упражнение завершено!', 'Activity complete!')}</strong>
            <button className="secondary" onClick={restart}>
              <RotateCcw size={16} />
              {t('Ещё раз', 'Try again')}
            </button>
          </div>
        ) : (
          <div className="composer">
            {hints && !open && (
              <>
                <button
                  className="hint-button"
                  aria-expanded={hintShown}
                  onClick={() => setHintShown(!hintShown)}
                >
                  <Lightbulb size={17} /> {t('Подсказка', 'Hint')}
                </button>
                {hintShown && (
                  <div className="activity-hint" lang="en">
                    <p className="hint-text">
                      {mode === 'guess'
                        ? academy
                          ? 'What is the first letter? Is it …?'
                          : 'Is it big? Has it got a tail? Is it a …?'
                        : !academy && mode === 'chat' && turn > 0
                          ? topics[topic].words
                          : activity.hint}
                    </p>
                    {academy && (
                      <ul
                        className="academy-words"
                        aria-label="Unit vocabulary"
                      >
                        {academy.vocabulary.map((word) => (
                          <li key={word}>{word}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
            {showSpeechInfo && (
              <div className="notice">
                <p>
                  {t(
                    'Для распознавания речи браузер может отправить звук своему сервису. Используй вымышленные данные.',
                    'Your browser may send audio to its speech recognition service. Use fictional details.',
                  )}
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setSpeechConsent(true)
                    setShowSpeechInfo(false)
                    startMic()
                  }}
                >
                  {t('Включить микрофон', 'Enable microphone')}
                </button>
              </div>
            )}
            <form
              className="input-row"
              onSubmit={(event) => {
                event.preventDefault()
                void submit()
              }}
            >
              <button
                type="button"
                className={`mic-button ${listening ? 'listening' : ''}`}
                aria-label={
                  listening
                    ? t('Остановить запись', 'Stop listening')
                    : t('Ответить голосом', 'Reply by voice')
                }
                disabled={!SpeechRecognition || pending}
                onClick={() => {
                  if (listening) recognizer.current?.stop()
                  else if (speechConsent) startMic()
                  else setShowSpeechInfo(!showSpeechInfo)
                }}
              >
                {listening ? <Square size={19} /> : <Mic size={21} />}
              </button>
              <input
                className="text-field"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                  if (!event.target.value) setVoice(false)
                }}
                maxLength={300}
                aria-label={t('Твой ответ', 'Your answer')}
                placeholder={t(
                  'Напиши ответ по-английски',
                  'Type an answer in English',
                )}
                disabled={pending || listening}
              />
              <button
                className="send-button"
                type="submit"
                aria-label={t('Отправить ответ', 'Send answer')}
                disabled={!draft.trim() || pending || listening}
              >
                <Send size={19} />
              </button>
            </form>
            <p className="status" role="status">
              {error ||
                (listening
                  ? t('Слушаю…', 'Listening…')
                  : voice
                    ? t(
                        'Проверь распознанный текст перед отправкой.',
                        'Check the recognised text before sending.',
                      )
                    : !SpeechRecognition
                      ? t(
                          'Здесь доступен текстовый ввод.',
                          'Text input is available in this browser.',
                        )
                      : '')}
            </p>
          </div>
        )}
        {finished && error && (
          <p className="status" role="status">
            {error}
          </p>
        )}
      </section>
    </div>
  )
}
