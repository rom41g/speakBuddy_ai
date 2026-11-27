import { useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  BookOpen,
  BookA,
  ChevronDown,
  CircleHelp,
  Globe2,
  GraduationCap,
  Headphones,
  Image,
  MessageCircle,
  Mic,
  Sparkles,
  Star,
  Store,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getAcademyUnit } from '../shared/academy'
import { roles, topics } from '../shared/lessons'
import type { Lang, Level, Mode, Role, Topic } from '../shared/lessons'
import { api } from './api'
import type { Capabilities } from './api'
import { prepareBrowserChat } from './browserChat'
import AcademyPicker from './AcademyPicker'
import AcademyDictionary from './AcademyDictionary'
import Practice from './Practice'
import Pronunciation from './Pronunciation'
import { stopSpeaking } from './speech'

export type Translate = (ru: string, en: string) => string
export type Progress = {
  turns: number
  voice: number
  finished: number
  recordings: number
  analyses: number
}
export type Settings = {
  lang: Lang
  level: Level
  topic: Topic
  enabled: Topic[]
  hints: boolean
  scores: boolean
  academy: string | null
  autoSpeak: boolean
}
export const emptyProgress: Progress = {
  turns: 0,
  voice: 0,
  finished: 0,
  recordings: 0,
  analyses: 0,
}

const modes: {
  id: Mode
  title: string
  ru: string
  en: string
  icon: LucideIcon
  theme: string
}[] = [
  {
    id: 'chat',
    title: 'AI Conversation',
    ru: 'Поговори с Бадди и попробуй новые слова.',
    en: 'Talk to Buddy and try new vocabulary.',
    icon: MessageCircle,
    theme: 'violet',
  },
  {
    id: 'role',
    title: 'Role Play',
    ru: 'Примерь роль и разыграй сцену с Бадди.',
    en: 'Take a role and act out a scene with Buddy.',
    icon: Store,
    theme: 'peach',
  },
  {
    id: 'pronounce',
    title: 'Pronunciation Lab',
    ru: 'Послушай фразу, повтори и запиши свой голос.',
    en: 'Listen, repeat and record your voice.',
    icon: AudioLines,
    theme: 'mint',
  },
  {
    id: 'picture',
    title: 'Describe the Picture',
    ru: 'Рассмотри картинку и расскажи, что на ней происходит.',
    en: 'Look at the picture and say what is happening.',
    icon: Image,
    theme: 'blue',
  },
  {
    id: 'guess',
    title: 'Guess the Word',
    ru: 'Угадай слово Бадди по подсказке.',
    en: 'Use a clue to guess Buddy’s word.',
    icon: CircleHelp,
    theme: 'pink',
  },
]

const defaults: Settings = {
  lang: 'ru',
  level: 'Pre-A1',
  topic: 'animals',
  enabled: Object.keys(topics) as Topic[],
  hints: true,
  scores: false,
  academy: '1-1',
  autoSpeak: true,
}
function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function useLocal<T>(key: string, fallback: T) {
  const [value, setValue] = useState(() => readLocal(key, fallback))
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* Private browsing. */
    }
  }, [key, value])
  return [value, setValue] as const
}

export default function App() {
  const [settings, setSettings] = useLocal('speakbuddy-settings-v1', defaults)
  const [progress, setProgress] = useLocal(
    'speakbuddy-progress-v1',
    emptyProgress,
  )
  const [session, setSession] = useState(emptyProgress)
  const [capabilities, setCapabilities] = useState<Capabilities>({
    chat: false,
    pronunciation: null,
  })
  const [screen, setScreen] = useState<
    Mode | 'home' | 'teacher' | 'dictionary'
  >('home')
  const [role, setRole] = useState<Role>('shop')
  const [attempt, setAttempt] = useState(0)
  const [access, setAccess] = useState('')
  const [cloud, setCloud] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const t: Translate = (ru, en) => (settings.lang === 'en' ? en : ru)
  const score = progress.finished + progress.analyses
  const academy = getAcademyUnit(settings.academy)

  useEffect(() => {
    document.documentElement.lang = settings.lang
  }, [settings.lang])
  useEffect(() => {
    window.speechSynthesis?.getVoices()
    void prepareBrowserChat().catch(() => {})
  }, [])
  useEffect(() => {
    api<Capabilities>('config')
      .then(setCapabilities)
      .catch(() => {})
  }, [])

  function navigate(next: typeof screen) {
    stopSpeaking()
    setScreen(next)
    setAttempt((current) => current + 1)
    window.scrollTo(0, 0)
    requestAnimationFrame(() => titleRef.current?.focus())
  }

  function report(change: Partial<Progress>) {
    const apply = (previous: Progress) => ({
      turns: previous.turns + (change.turns ?? 0),
      voice: previous.voice + (change.voice ?? 0),
      finished: previous.finished + (change.finished ?? 0),
      recordings: previous.recordings + (change.recordings ?? 0),
      analyses: previous.analyses + (change.analyses ?? 0),
    })
    setProgress(apply)
    setSession(apply)
  }

  function toggleTopic(topic: Topic) {
    const enabled = settings.enabled.includes(topic)
      ? settings.enabled.filter((item) => item !== topic)
      : [...settings.enabled, topic]
    if (enabled.length)
      setSettings({
        ...settings,
        enabled,
        topic: enabled.includes(settings.topic) ? settings.topic : enabled[0],
      })
  }

  const freeTitle = t('Свободный чат', 'Free chat')
  const current =
    screen === 'free'
      ? { id: screen, title: freeTitle }
      : modes.find((item) => item.id === screen)
  const curriculumPicker = (
    <AcademyPicker
      unit={academy}
      t={t}
      showWords={screen === 'teacher'}
      change={(id) => {
        stopSpeaking()
        setSettings((previous) => ({ ...previous, academy: id }))
      }}
    />
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="top-inner">
          <button
            className="brand"
            onClick={() => navigate('home')}
            aria-label={t('SpeakBuddy AI, главная', 'SpeakBuddy AI, home')}
          >
            <span className="brand-symbol">
              <AudioLines size={22} />
            </span>
            <span>
              SpeakBuddy <strong>AI</strong>
              <small>ENGLISH SPEAKING CLUB</small>
            </span>
          </button>
          <nav aria-label={t('Основная навигация', 'Main navigation')}>
            <button
              className={`nav-button ${!['teacher', 'free', 'dictionary'].includes(screen) ? 'current' : ''}`}
              onClick={() => navigate('home')}
            >
              <BookOpen size={18} />
              <span>{t('Практика', 'Practice')}</span>
            </button>
            <button
              className={`nav-button ${screen === 'free' ? 'current' : ''}`}
              onClick={() => navigate('free')}
            >
              <MessageCircle size={18} /> <span>{freeTitle}</span>
            </button>
            <button
              className={`nav-button ${screen === 'dictionary' ? 'current' : ''}`}
              onClick={() => navigate('dictionary')}
            >
              <BookA size={18} /> <span>{t('Словарь', 'Dictionary')}</span>
            </button>
            <button
              className={`nav-button ${screen === 'teacher' ? 'current' : ''}`}
              onClick={() => navigate('teacher')}
            >
              <GraduationCap size={19} />
              <span>{t('Учителю', 'Teacher')}</span>
            </button>
          </nav>
          <div className="top-actions">
            <span
              className="stars"
              aria-label={`${t('Звёзды', 'Stars')}: ${score}`}
            >
              <Star size={17} fill="currentColor" /> {score}
            </span>
            <button
              className="lang-button"
              aria-label={t('Переключить на английский', 'Switch to Russian')}
              onClick={() =>
                setSettings({
                  ...settings,
                  lang: settings.lang === 'ru' ? 'en' : 'ru',
                })
              }
            >
              <Globe2 size={17} />
              {settings.lang.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="container-main">
        {screen === 'home' && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="hero-label">
                  <Headphones size={15} />{' '}
                  {t('ГОВОРИМ ПО-АНГЛИЙСКИ', 'LET’S SPEAK ENGLISH')}
                </div>
                <h1 tabIndex={-1} ref={titleRef}>
                  {t('Твой друг для', 'Your buddy for')}
                  <br />
                  <em>{t('английской речи', 'speaking English')}</em>
                </h1>
                <p>
                  {t(
                    'Задавай вопросы, играй в роли и пробуй новые фразы вместе с Бадди.',
                    'Ask questions, play a role and try new phrases with Buddy.',
                  )}
                </p>
                <div className="hero-buttons">
                  <button
                    className="primary hero-action"
                    onClick={() => navigate('chat')}
                  >
                    <Mic size={19} /> {t('Начать разговор', 'Start talking')}
                  </button>
                  <button
                    className="secondary hero-free"
                    onClick={() => navigate('free')}
                  >
                    <MessageCircle size={19} /> {freeTitle}
                  </button>
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-outer" />
                <div className="orbit orbit-inner" />
                <span className="spark spark-one">✦</span>
                <span className="spark spark-two">✧</span>
                <span className="spark spark-three">✦</span>
                <div className="buddy">
                  <div className="buddy-face">
                    <i />
                    <i />
                    <b />
                  </div>
                  <span className="buddy-ear ear-left" />
                  <span className="buddy-ear ear-right" />
                </div>
                <span className="bubble hello">Hello!</span>
                <span className="bubble reply">
                  <AudioLines size={25} />
                </span>
              </div>
            </section>
            {curriculumPicker}
            <section className="mode-section" aria-labelledby="mode-heading">
              <div className="section-title">
                <div>
                  <h2 id="mode-heading">
                    {t('Выбери упражнение', 'Choose an activity')}
                  </h2>
                  <p>
                    {t('Что попробуем сегодня?', 'What shall we try today?')}
                  </p>
                </div>
                <span className="level">
                  <Sparkles size={16} /> {settings.level}
                </span>
              </div>
              <div className="mode-grid">
                {modes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`mode-card ${item.theme}`}
                  >
                    <span className="mode-icon">
                      <item.icon size={24} strokeWidth={2} />
                    </span>
                    <strong lang="en">{item.title}</strong>
                    <span>{t(item.ru, item.en)}</span>
                  </button>
                ))}
                <button
                  onClick={() => navigate('teacher')}
                  className="mode-card yellow"
                >
                  <span className="mode-icon">
                    <GraduationCap size={25} />
                  </span>
                  <strong>{t('Режим учителя', 'Teacher Mode')}</strong>
                  <span>
                    {t(
                      'Темы, сложность и результаты занятия.',
                      'Topics, level and session results.',
                    )}
                  </span>
                </button>
              </div>
            </section>
          </>
        )}

        {screen === 'dictionary' && (
          <>
            <h1 className="page-title" tabIndex={-1} ref={titleRef}>
              {t('Словарь Academy Stars', 'Academy Stars Dictionary')}
            </h1>
            {curriculumPicker}
            <AcademyDictionary unit={academy} t={t} />
          </>
        )}

        {screen === 'teacher' && (
          <>
            <button className="back" onClick={() => navigate('home')}>
              {t('Все упражнения', 'All activities')}
            </button>
            <h1 className="page-title" tabIndex={-1} ref={titleRef}>
              {t('Режим учителя', 'Teacher Mode')}
            </h1>
            <div className="teacher-grid">
              <section className="panel settings-panel">
                <h2>{t('Настройки занятия', 'Lesson settings')}</h2>
                {curriculumPicker}
                <label htmlFor="level">{t('Сложность', 'Level')}</label>
                <div className="select-wrap">
                  <select
                    id="level"
                    value={settings.level}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        level: event.target.value as Level,
                      })
                    }
                  >
                    <option>Pre-A1</option>
                    <option>A1</option>
                  </select>
                  <ChevronDown size={17} />
                </div>
                {!academy && (
                  <fieldset>
                    <legend>
                      {t('Темы для разговора', 'Conversation topics')}
                    </legend>
                    <div className="topic-list">
                      {(Object.keys(topics) as Topic[]).map((id) => (
                        <button
                          className={`chip ${settings.enabled.includes(id) ? 'selected' : ''}`}
                          aria-pressed={settings.enabled.includes(id)}
                          key={id}
                          onClick={() => toggleTopic(id)}
                        >
                          {topics[id].icon} {t(topics[id].ru, topics[id].en)}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={settings.hints}
                    onChange={(event) =>
                      setSettings({ ...settings, hints: event.target.checked })
                    }
                  />
                  {t('Показывать речевые подсказки', 'Show speaking hints')}
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={settings.scores}
                    onChange={(event) =>
                      setSettings({ ...settings, scores: event.target.checked })
                    }
                  />
                  {t(
                    'Показывать баллы произношения',
                    'Show pronunciation scores',
                  )}
                </label>
              </section>
              <section className="panel results-panel">
                <h2>{t('Текущее занятие', 'Current session')}</h2>
                <dl>
                  {(
                    [
                      ['turns', t('Реплики', 'Replies')],
                      ['voice', t('Реплики голосом', 'Spoken replies')],
                      [
                        'finished',
                        t('Упражнения завершены', 'Activities finished'),
                      ],
                      [
                        'recordings',
                        t(
                          'Записи для произношения',
                          'Pronunciation recordings',
                        ),
                      ],
                      [
                        'analyses',
                        t('Фонетические анализы', 'Pronunciation assessments'),
                      ],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>{session[key]}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  className="secondary"
                  onClick={() => setSession(emptyProgress)}
                >
                  {t('Обнулить счётчики занятия', 'Reset session counters')}
                </button>
              </section>
              <section className="panel cloud-panel">
                <h2>{t('Облачные функции', 'Cloud features')}</h2>
                <p>
                  {t(
                    'Подключение для демонстрации со взрослыми. OpenRouter получает текст диалога, Azure Speech получает запись при запуске анализа, а Cambridge Dictionary получает отдельное слово для поиска. Используйте вымышленные данные.',
                    'For demonstrations with adults. OpenRouter receives conversation text, Azure Speech receives a recording for assessment, and Cambridge Dictionary receives an individual search word. Use fictional details.',
                  )}
                </p>
                <div className="cloud-status">
                  <span>
                    OpenRouter ·{' '}
                    {capabilities.chat
                      ? t('доступен', 'available')
                      : t('не подключён', 'unconfigured')}
                  </span>
                  <span>
                    Azure Speech ·{' '}
                    {capabilities.pronunciation === 'azure'
                      ? t('доступен', 'available')
                      : t('не подключён', 'unconfigured')}
                  </span>
                  <span>
                    Cambridge Dictionary ·{' '}
                    {capabilities.dictionary
                      ? t('доступен', 'available')
                      : t('не подключён', 'unconfigured')}
                  </span>
                  {capabilities.pronunciation === 'local' && (
                    <span>
                      Pronunciada · {t('локальный анализ', 'local assessment')}
                    </span>
                  )}
                </div>
                {(capabilities.chat ||
                  capabilities.dictionary ||
                  capabilities.pronunciation === 'azure') && (
                  <>
                    <label htmlFor="access">
                      {t('Код демонстрации', 'Demo access code')}
                    </label>
                    <input
                      id="access"
                      className="text-field"
                      type="password"
                      autoComplete="off"
                      value={access}
                      onChange={(event) => setAccess(event.target.value)}
                    />
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={cloud}
                        onChange={(event) => setCloud(event.target.checked)}
                      />
                      {t(
                        'Разрешить облачные функции до закрытия вкладки',
                        'Enable cloud features for this tab',
                      )}
                    </label>
                  </>
                )}
              </section>
            </div>
          </>
        )}

        {current && (
          <>
            <div className="practice-heading">
              <div>
                <button className="back" onClick={() => navigate('home')}>
                  {t('Все упражнения', 'All activities')}
                </button>
                <h1
                  className="page-title"
                  tabIndex={-1}
                  ref={titleRef}
                  lang={screen === 'free' ? settings.lang : 'en'}
                >
                  {current.title}
                </h1>
              </div>
              <span className="level">
                <Sparkles size={16} /> {settings.level}
              </span>
            </div>
            {screen !== 'free' && curriculumPicker}
            {screen === 'chat' && !academy && (
              <div
                className="topic-list choose-topic"
                aria-label={t('Выбрать тему', 'Choose a topic')}
              >
                {settings.enabled.map((id) => (
                  <button
                    key={id}
                    className={`chip ${id === settings.topic ? 'selected' : ''}`}
                    aria-pressed={id === settings.topic}
                    onClick={() => {
                      if (id !== settings.topic) {
                        stopSpeaking()
                        setSettings({ ...settings, topic: id })
                      }
                    }}
                  >
                    {topics[id].icon} {t(topics[id].ru, topics[id].en)}
                  </button>
                ))}
              </div>
            )}
            {screen === 'role' && !academy && (
              <div
                className="topic-list choose-topic"
                aria-label={t('Выбрать сцену', 'Choose a scene')}
              >
                {(Object.keys(roles) as Role[]).map((id) => (
                  <button
                    key={id}
                    className={`chip ${role === id ? 'selected' : ''}`}
                    aria-pressed={role === id}
                    onClick={() => {
                      stopSpeaking()
                      setRole(id)
                    }}
                  >
                    {t(roles[id].ru, roles[id].en)}
                  </button>
                ))}
              </div>
            )}
            {screen === 'pronounce' ? (
              <Pronunciation
                key={`${academy?.id ?? 'free'}-${attempt}`}
                academy={academy}
                t={t}
                showScores={settings.scores}
                provider={
                  capabilities.pronunciation === 'local' || (cloud && access)
                    ? capabilities.pronunciation
                    : null
                }
                access={access}
                report={report}
              />
            ) : (
              <Practice
                key={`${screen}-${academy?.id ?? 'free'}-${settings.topic}-${role}-${attempt}`}
                mode={current.id as Exclude<Mode, 'pronounce'>}
                academy={screen === 'free' ? undefined : academy}
                topic={settings.topic}
                role={role}
                t={t}
                level={settings.level}
                hints={settings.hints}
                autoSpeak={settings.autoSpeak}
                dictionaryAccess={
                  cloud && capabilities.dictionary ? access : ''
                }
                changeAutoSpeak={(enabled) =>
                  setSettings((previous) => ({
                    ...previous,
                    autoSpeak: enabled,
                  }))
                }
                access={cloud && capabilities.chat ? access : ''}
                report={report}
                restart={() => navigate(current.id)}
              />
            )}
          </>
        )}
      </main>
      <footer>
        <span>
          <AudioLines size={16} /> SpeakBuddy AI
        </span>
        <span>
          {t(
            'Учебный прототип · 2–4 классы',
            'Learning prototype · Grades 2–4',
          )}
        </span>
        <button onClick={() => navigate('teacher')}>
          {t('Настройки занятия', 'Lesson settings')}
        </button>
      </footer>
    </div>
  )
}
