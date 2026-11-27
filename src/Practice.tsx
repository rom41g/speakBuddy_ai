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
} from 'lucide-react'
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
import type { Progress, Translate } from './App'
import { speak, SpeechRecognition } from './speech'

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
  topic: Topic
  role: Role
  level: Level
  t: Translate
  hints: boolean
  access: string
  report(change: Partial<Progress>): void
  restart(): void
}

export default function Practice({
  mode,
  topic,
  role,
  level,
  t,
  hints,
  access,
  report,
  restart,
}: Props) {
  const activity = lesson(mode, topic, role)
  const question =
    mode === 'guess'
      ? 'I am thinking of an animal. Ask me a question!'
      : activity.question
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: question },
  ])
  const [animal] = useState(
    () => animals[Math.floor(Math.random() * animals.length)],
  )
  const [draft, setDraft] = useState('')
  const [voice, setVoice] = useState(false)
  const [listening, setListening] = useState(false)
  const [speechConsent, setSpeechConsent] = useState(false)
  const [showSpeechInfo, setShowSpeechInfo] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [finished, setFinished] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const recognizer = useRef<InstanceType<
    NonNullable<typeof SpeechRecognition>
  > | null>(null)
  const mounted = useRef(false)
  const transcript = useRef<HTMLDivElement>(null)
  const turn = messages.filter((item) => item.role === 'user').length
  const target = level === 'A1' ? 4 : 3

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      const active = recognizer.current
      if (active) {
        active.onend = active.onerror = active.onresult = null
        active.abort()
      }
    }
  }, [])
  useEffect(() => {
    if (transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight
  }, [messages, pending])

  function listen(content: string) {
    if (!speak(content, level === 'Pre-A1' ? 0.79 : 0.9))
      setError(
        t(
          'В браузере нет озвучивания.',
          'Speech playback is unavailable in this browser.',
        ),
      )
  }

  function startMic() {
    if (!SpeechRecognition || recognizer.current) return
    window.speechSynthesis?.cancel()
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
    setError('')
    setDraft('')
    setVoice(false)
    const history: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(history)
    report({ turns: 1, voice: voice ? 1 : 0 })
    let done: boolean
    let reply: Message

    if (mode === 'guess') {
      const result = guessReply(animal, text, turn + 1)
      done = result.done
      reply = { role: 'assistant', content: result.content }
    } else {
      done = turn + 1 >= target
      reply = scriptReply(mode, topic, role, text, turn + 1, target)
      if (access) {
        setPending(true)
        const payload: ChatRequest = { mode, topic, role, level, history }
        try {
          reply = await api<Message>('chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Demo-Code': access,
            },
            body: JSON.stringify(payload),
          })
        } catch {
          if (mounted.current)
            setError(
              t(
                'ИИ сейчас недоступен. Продолжаем по учебному сценарию.',
                'AI is unavailable. Continuing with the prepared lesson.',
              ),
            )
        } finally {
          if (mounted.current) setPending(false)
        }
      }
    }
    if (!mounted.current) return
    setMessages([...history, reply])
    if (done) {
      setFinished(true)
      report({ finished: 1 })
    }
  }

  return (
    <div className={`activity-layout ${mode === 'picture' ? 'split' : ''}`}>
      {mode === 'picture' && (
        <figure className="panel picture-panel">
          <img
            src={`${import.meta.env.BASE_URL}park.webp`}
            alt={t(
              'В парке коричневая собака бежит к красному мячу. Рядом с деревом стоит скамейка.',
              picture.details,
            )}
          />
          <figcaption>
            {t(
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
                : t('Учебный сценарий', 'Prepared lesson')}
            </p>
          </div>
          <span className="turns">
            {mode === 'guess' ? `${turn}/6` : `${turn}/${target}`}{' '}
            {t('реплик', 'replies')}
          </span>
        </div>
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
            {hints && (
              <>
                <button
                  className="hint-button"
                  aria-expanded={hintShown}
                  onClick={() => setHintShown(!hintShown)}
                >
                  <Lightbulb size={17} /> {t('Подсказка', 'Hint')}
                </button>
                {hintShown && (
                  <p className="hint-text" lang="en">
                    {mode === 'guess'
                      ? 'Is it big? Has it got a tail? Is it a …?'
                      : mode === 'chat' && turn > 0
                        ? topics[topic].words
                        : activity.hint}
                  </p>
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
