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
import type { AcademyBook, AcademyUnit } from '../shared/academy'
import {
  britishPronunciation,
  pronunciationQuestion,
} from '../shared/britishDictionary'
import type { BritishPronunciation } from '../shared/britishDictionary'
import { freeChatOpening } from '../shared/chatPrompt'
import { replyFilter } from '../shared/chatReply'
import { containsContact, lesson, picture, topics } from '../shared/lessons'
import type {
  ChatRequest,
  Level,
  Message,
  Mode,
  Role,
  Topic,
} from '../shared/lessons'
import { api } from './api'
import DictionaryCard from './DictionaryCard'
import { browserChat } from './browserChat'
import type { ModelStatus } from './localChat'
import { playDictionaryAudio } from './dictionaryAudio'
import type { Progress, Translate } from './App'
import {
  britishLocale,
  playbackMessage,
  speak,
  SpeechRecognition,
  stopSpeaking,
} from './speech'
import type { PlaybackStatus } from './speech'
import { formatSpokenText } from './spokenText'

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

function MessageText({
  message,
  t,
  open,
}: {
  message: Message
  t: Translate
  open: boolean
}) {
  const text = (
    <div lang="en-GB">
      {message.content}
      {message.correction && (
        <p className="correction" lang={t('ru', 'en')}>
          <Sparkles size={15} /> {t('Попробуй так', 'Try saying')}{' '}
          <span lang="en-GB">{message.correction}</span>
        </p>
      )}
    </div>
  )
  if (!message.voiceOnly) return text
  return (
    <details className="voice-transcript" open={open || undefined}>
      <summary>{t('Текст ответа', 'Reply transcript')}</summary>
      {text}
    </details>
  )
}

type Props = {
  mode: Exclude<Mode, 'pronounce'>
  academy?: AcademyUnit
  book?: AcademyBook
  topic: Topic
  role: Role
  level: Level
  t: Translate
  hints: boolean
  autoSpeak: boolean
  dictionaryAccess: string
  changeAutoSpeak(enabled: boolean): void
  access: string
  report(change: Partial<Progress>): void
  restart(): void
}

export default function Practice({
  mode,
  academy,
  book,
  topic,
  role,
  level,
  t,
  hints,
  autoSpeak,
  dictionaryAccess,
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
  const [draft, setDraft] = useState('')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [finished, setFinished] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const [playback, setPlayback] = useState<PlaybackStatus>()
  const [modelStatus, setModelStatus] = useState<ModelStatus>()
  const [replyPreview, setReplyPreview] = useState('')
  const recognizer = useRef<InstanceType<
    NonNullable<typeof SpeechRecognition>
  > | null>(null)
  const micControls = useRef<{ stop(): void; clear(): void } | null>(null)
  const mounted = useRef(false)
  const transcript = useRef<HTMLDivElement>(null)
  const localModel = useRef<AbortController | null>(null)
  const target = level === 'A1' ? 4 : 3

  useEffect(() => {
    mounted.current = true
    const controller = new AbortController()
    localModel.current = controller
    return () => {
      mounted.current = false
      controller.abort()
      stopSpeaking()
      const active = recognizer.current
      if (active) {
        micControls.current?.clear()
        active.onend =
          active.onerror =
          active.onresult =
          active.onspeechend =
          active.onspeechstart =
            null
        active.abort()
      }
    }
  }, [])
  useEffect(() => {
    if (transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight
  }, [messages, pending, replyPreview])

  function listen(content: string, continuation?: Promise<string>) {
    speak(
      content,
      level === 'Pre-A1' ? 0.88 : 0.96,
      (status) => {
        if (mounted.current) setPlayback(status)
      },
      continuation,
    )
  }

  function startMic() {
    if (!SpeechRecognition || recognizer.current || pending || finished) return
    stopSpeaking()
    setError('')
    const recognition = new SpeechRecognition()
    recognition.lang = britishLocale
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    let finalText = ''
    let heardText = ''
    let failed = false
    let stopping = false
    let pauseTimer: number | undefined
    const sessionTimer = window.setTimeout(stop, 45000)
    function clearPause() {
      window.clearTimeout(pauseTimer)
    }
    function clear() {
      clearPause()
      window.clearTimeout(sessionTimer)
    }
    function stop() {
      if (stopping || recognizer.current !== recognition) return
      stopping = true
      clear()
      recognition.stop()
    }
    function waitForPause(delay = 1600) {
      if (stopping) return
      clearPause()
      pauseTimer = window.setTimeout(stop, delay)
    }
    recognition.onspeechstart = clearPause
    recognition.onspeechend = () => waitForPause()
    recognition.onresult = (event) => {
      const results = Array.from(event.results)
      heardText = results
        .map((result) => result[0]?.transcript.trim() ?? '')
        .join(' ')
        .trim()
      finalText = results
        .filter((result) => result.isFinal !== false)
        .map((result) => result[0]?.transcript.trim() ?? '')
        .join(' ')
        .trim()
      waitForPause(results.at(-1)?.isFinal === false ? 2500 : 1600)
    }
    recognition.onerror = (event) => {
      clear()
      if (event.error === 'no-speech' && finalText) return
      failed = true
      if (event.error !== 'aborted')
        setError(
          event.error === 'not-allowed'
            ? t(
                'Микрофон заблокирован. Проверь разрешение для SpeakBuddy в настройках сайта браузера.',
                'Microphone access is blocked. Check the browser’s site settings for SpeakBuddy.',
              )
            : t(
                'Распознавание не сработало. Попробуй ещё раз или напечатай ответ.',
                'Speech recognition failed. Try again or type your answer.',
              ),
        )
    }
    recognition.onend = () => {
      if (recognizer.current !== recognition || !mounted.current) return
      clear()
      micControls.current = null
      recognizer.current = null
      setListening(false)
      const spoken = finalText || heardText
      if (spoken && !failed) void submit(spoken, true)
      else if (!failed)
        setError(
          t(
            'Не удалось разобрать реплику. Попробуй ещё раз.',
            'No speech was recognised. Please try again.',
          ),
        )
    }
    try {
      recognizer.current = recognition
      micControls.current = { stop, clear }
      recognition.start()
      setListening(true)
    } catch {
      clear()
      micControls.current = null
      recognizer.current = null
      setError(
        t('Не удалось запустить микрофон.', 'Could not start the microphone.'),
      )
    }
  }

  async function submit(input: string, spoken = false) {
    const raw = input.trim()
    if (!raw || pending || finished || recognizer.current) return
    if (containsContact(raw)) {
      setError(
        t(
          'Попробуй ответить без номера телефона, адреса почты или ссылки.',
          'Try a reply without a phone number, email address or link.',
        ),
      )
      return
    }
    const text = spoken ? formatSpokenText(raw).slice(0, 300) : raw
    const headword = pronunciationQuestion(text)
    stopSpeaking()
    setPlayback(undefined)
    setError('')
    if (!spoken) setDraft('')
    const history: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(history)
    let done = false
    let reply: Message
    let spokenPrefix = ''
    let resolveAudio: ((rest: string) => void) | undefined
    const step = turn + 1

    if (headword) {
      let pronunciation = britishPronunciation(headword)
      if (!pronunciation.forms.length && dictionaryAccess) {
        setPending(true)
        const found = await api<BritishPronunciation>(
          `dictionary?q=${encodeURIComponent(headword)}`,
          {
            method: 'POST',
            headers: { 'X-Demo-Code': dictionaryAccess },
          },
        ).catch(() => undefined)
        if (!mounted.current) return
        setPending(false)
        if (found) pronunciation = found
      }
      reply = {
        role: 'assistant',
        content: `British pronunciation of ${headword}.`,
        pronunciation,
      }
    } else if (mode === 'guess') {
      const result = card
        ? academyGuess(card, text, step)
        : guessReply(animal, text, step)
      done = result.done
      reply = { role: 'assistant', content: result.content }
    } else {
      done = !open && step >= target
      const signal = localModel.current?.signal
      if (!signal) return
      setPending(true)
      // Looking up a word pauses the exercise question until the pupil answers it.
      const dialogue = open ? history : history.filter((message, index) =>
        !message.pronunciation && !history[index + 1]?.pronunciation,
      )
      const payload: ChatRequest = {
        mode,
        topic,
        role,
        level,
        book,
        history: dialogue
          .slice(-8)
          .map(({ role, content }) => ({ role, content })),
        academy: academy?.id,
        step: open ? undefined : step,
      }
      const generated =
        (access
          ? await api<Message>('chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Demo-Code': access,
              },
              body: JSON.stringify(payload),
              signal,
            })
              .then((response) => {
                const content = replyFilter(payload)(response.content)
                return content ? { ...response, content } : undefined
              })
              .catch(() => undefined)
          : undefined) ??
        (await browserChat(
          payload,
          signal,
          (status) => {
            if (!signal.aborted) setModelStatus(status)
          },
          (content) => {
            if (signal.aborted) return
            if (!spoken) setReplyPreview(content)
            if (content && (spoken || autoSpeak) && !resolveAudio) {
              spokenPrefix = content
              const continuation = new Promise<string>((resolve) => {
                resolveAudio = resolve
              })
              listen(content, continuation)
            }
          },
        ).catch(() => undefined))
      if (signal.aborted) {
        resolveAudio?.('')
        return
      }
      setPending(false)
      setModelStatus(undefined)
      setReplyPreview('')
      if (!generated && !spokenPrefix) {
        setMessages(messages)
        setDraft(text)
        setError(
          t(
            'Бадди не смог ответить. Твоя реплика в поле ввода, её можно отправить ещё раз.',
            'Buddy could not reply. Your message is still in the input field so you can send it again.',
          ),
        )
        return
      }
      reply = generated ?? { role: 'assistant', content: spokenPrefix }
    }
    if (!mounted.current) return
    report({ turns: 1, voice: spoken ? 1 : 0 })
    if (!open && !headword) setTurn(step)
    setMessages([...history, { ...reply, voiceOnly: spoken }])
    if (autoSpeak || spoken) {
      const form = reply.pronunciation?.forms[0]
      if (form?.file) {
        void playDictionaryAudio(form).then((status) => {
          if (mounted.current && (status === 'blocked' || status === 'unavailable'))
            setPlayback(status)
        })
      } else if (!reply.pronunciation) {
        const rest = spokenPrefix
          ? reply.content.startsWith(spokenPrefix)
            ? reply.content.slice(spokenPrefix.length).trim()
            : ''
          : reply.content
        const audio = [rest, reply.correction].filter(Boolean).join(' ')
        if (resolveAudio) resolveAudio(audio)
        else listen(audio)
      }
    }
    if (done) {
      setFinished(true)
      report({ finished: 1 })
    }
  }

  const audioStatus = playbackMessage(playback, t)
  const showAudioFallback = playback === 'blocked' || playback === 'unavailable'

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
              {mode === 'guess'
                ? t('Словарная игра', 'Vocabulary game')
                : t('ИИ-диалог', 'AI conversation')}
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
              {t('Озвучка текста', 'Read typed replies')}
            </button>
            {open && messages.length > 1 && (
              <button className="audio-toggle" onClick={restart}>
                <RotateCcw size={16} /> {t('Новый чат', 'New chat')}
              </button>
            )}
          </div>
        </div>
        <div
          className="transcript"
          ref={transcript}
          role="log"
          aria-live="polite"
        >
          {messages.map((message, index) => (
            <div className={`turn ${message.role}`} key={index}>
              <div className="message">
                {message.pronunciation ? (
                  <DictionaryCard entry={message.pronunciation} t={t} />
                ) : (
                  <MessageText
                    message={message}
                    t={t}
                    open={showAudioFallback && index === messages.length - 1}
                  />
                )}
              </div>
              {message.role === 'assistant' && !message.pronunciation && (
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
          {replyPreview && (
            <div className="turn assistant" aria-hidden="true">
              <div className="message" lang="en-GB">
                {replyPreview}
              </div>
            </div>
          )}
          {pending && !replyPreview && (
            <p className="status">
              {modelStatus?.phase === 'downloading'
                ? t(
                    'Загружаю модель ИИ в браузер (около 397 МБ)',
                    'Downloading the AI model (about 397 MB)',
                  ) +
                  (modelStatus.percent === undefined
                    ? '…'
                    : ` · ${modelStatus.percent}%`)
                : modelStatus?.phase === 'starting'
                  ? t('Запускаю ИИ…', 'Starting the AI…')
                  : t('Бадди готовит ответ…', 'Buddy is thinking…')}
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
            <form
              className="input-row"
              onSubmit={(event) => {
                event.preventDefault()
                void submit(draft)
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
                title={t(
                  'Браузер может распознавать речь через свой сервис',
                  'Your browser may use its speech recognition service',
                )}
                onClick={
                  listening ? () => micControls.current?.stop() : startMic
                }
              >
                {listening ? <Square size={19} /> : <Mic size={21} />}
              </button>
              <input
                className="text-field"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
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
