import { useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  ChevronDown,
  Headphones,
  Mic,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react'
import { academyPronunciations } from '../shared/academy'
import type { AcademyUnit } from '../shared/academy'
import { phrases } from '../shared/lessons'
import { api } from './api'
import type { Assessment } from './api'
import type { Progress, Translate } from './App'
import { makeWav, playbackMessage, speak, stopSpeaking } from './speech'
import type { PlaybackStatus } from './speech'

export default function Pronunciation({
  t,
  academy,
  showScores,
  provider,
  access,
  report,
}: {
  t: Translate
  academy?: AcademyUnit
  showScores: boolean
  provider: 'local' | 'azure' | null
  access: string
  report(change: Partial<Progress>): void
}) {
  const references: Record<
    string,
    { text: string; ru: string; tip: string; ipa: string }
  > = academy ? academyPronunciations(academy) : phrases
  const [id, setId] = useState(academy ? 'sentence' : 'bear')
  const [stage, setStage] = useState<
    'idle' | 'starting' | 'recording' | 'stopping' | 'analysis'
  >('idle')
  const [audio, setAudio] = useState<Blob>()
  const [audioUrl, setAudioUrl] = useState('')
  const [result, setResult] = useState<Assessment>()
  const [error, setError] = useState('')
  const [playback, setPlayback] = useState<PlaybackStatus>()
  const active = useRef<MediaRecorder | null>(null)
  const timer = useRef<number>(0)
  const mounted = useRef(false)
  const phrase = references[id]

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stopSpeaking()
      window.clearTimeout(timer.current)
      active.current?.stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!audio) {
      setAudioUrl('')
      return
    }
    const url = URL.createObjectURL(audio)
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audio])

  function stopRecording() {
    window.clearTimeout(timer.current)
    if (active.current?.state === 'recording') {
      setStage('stopping')
      active.current.stop()
    }
  }

  function listen(text: string) {
    speak(text, 0.76, (status) => {
      if (mounted.current) setPlayback(status)
    })
  }

  async function record() {
    setStage('starting')
    setError('')
    stopSpeaking()
    setPlayback(undefined)
    let stream: MediaStream | undefined
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      let failed = false
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      recorder.onerror = () => {
        failed = true
        recorder.stream.getTracks().forEach((track) => track.stop())
        if (mounted.current)
          setError(
            t(
              'Во время записи возникла ошибка.',
              'An error occurred while recording.',
            ),
          )
      }
      recorder.onstop = () => {
        window.clearTimeout(timer.current)
        active.current = null
        recorder.stream.getTracks().forEach((track) => track.stop())
        if (!mounted.current) return
        setStage('idle')
        if (failed) return
        const sample = new Blob(chunks, { type: recorder.mimeType })
        if (!sample.size) {
          setError(
            t(
              'Запись пустая. Попробуй ещё раз.',
              'The recording was empty. Try again.',
            ),
          )
          return
        }
        setAudio(sample)
        setResult(undefined)
        report({ recordings: 1 })
      }
      recorder.start()
      active.current = recorder
      setStage('recording')
      timer.current = window.setTimeout(stopRecording, 14000)
    } catch {
      stream?.getTracks().forEach((track) => track.stop())
      if (mounted.current) {
        setStage('idle')
        setError(
          t(
            'Микрофон недоступен. Попробуй разрешить запись в браузере.',
            'Microphone unavailable. Check the browser’s microphone permission.',
          ),
        )
      }
    }
  }

  async function assess() {
    if (!audio || !provider || stage !== 'idle' || result) return
    setStage('analysis')
    setError('')
    try {
      const wav = await makeWav(audio)
      if (!mounted.current) return
      const headers = new Headers({ 'Content-Type': 'audio/wav' })
      if (provider === 'azure') headers.set('X-Demo-Code', access)
      const params = new URLSearchParams({ phrase: id, provider })
      if (academy) params.set('academy', academy.id)
      const assessment = await api<Assessment>(`pronunciation?${params}`, {
        method: 'POST',
        headers,
        body: wav,
      })
      if (mounted.current) {
        setResult(assessment)
        report({ analyses: 1 })
      }
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error && cause.message === '422'
            ? t(
                'Мало разборчивой речи. Попробуй записать всю фразу ещё раз.',
                'Too little speech was recognised. Try recording the whole phrase again.',
              )
            : t(
                'Анализ сейчас недоступен. Свою запись можно прослушать.',
                'Assessment is unavailable. You can still play your recording.',
              ),
        )
    } finally {
      if (mounted.current) setStage('idle')
    }
  }

  const weakest = result?.words
    .filter((word) => word.score != null && word.needsPractice)
    .sort((a, b) => a.score! - b.score!)[0]
  const missed = result?.words.find((word) => word.omitted)
  const audioStatus = playbackMessage(playback, t)

  return (
    <div className="pronunciation-grid">
      <section className="panel phrase-panel">
        <span className="mode-icon mint">
          <Headphones size={25} />
        </span>
        <h2>{t('Послушай и повтори', 'Listen and repeat')}</h2>
        <label htmlFor="phrase">
          {t('Выбери образец', 'Choose an example')}
        </label>
        <div className="select-wrap">
          <select
            id="phrase"
            value={id}
            disabled={stage !== 'idle'}
            onChange={(event) => {
              stopSpeaking()
              setPlayback(undefined)
              setId(event.target.value)
              setAudio(undefined)
              setResult(undefined)
              setError('')
            }}
          >
            {Object.entries(references).map(([key, reference]) => (
              <option key={key} value={key}>
                {reference.text}
              </option>
            ))}
          </select>
          <ChevronDown size={17} />
        </div>
        <blockquote lang="en">{phrase.text}</blockquote>
        {phrase.ru && (
          <p>{t(phrase.ru, 'Try the whole sentence at your own pace.')}</p>
        )}
        <button
          className="secondary"
          disabled={stage !== 'idle'}
          onClick={() => listen(phrase.text)}
        >
          <Volume2 size={19} />
          {t('Послушать образец', 'Hear the example')}
        </button>
        {audioStatus && (
          <p className="status" role="status">
            {audioStatus}
          </p>
        )}
        <p className="phrase-tip">
          <Sparkles size={17} />
          <span>
            {t('Обрати внимание на звук', 'Listen for the sound')}{' '}
            <strong>{phrase.ipa}</strong> {t('в слове', 'in')}{' '}
            <strong lang="en">{phrase.tip}</strong>.
          </span>
        </p>
      </section>
      <section className="panel record-panel">
        <span className="mode-icon violet">
          <AudioLines size={23} />
        </span>
        <h2>{t('Твоя запись', 'Your recording')}</h2>
        <p>
          {t(
            'Нажми на микрофон, повтори образец и останови запись.',
            'Press the microphone, repeat the example and stop the recording.',
          )}
        </p>
        <button
          className={`mic-button ${stage === 'recording' ? 'listening' : ''}`}
          disabled={
            (stage !== 'idle' && stage !== 'recording') ||
            !navigator.mediaDevices?.getUserMedia ||
            typeof MediaRecorder === 'undefined'
          }
          onClick={stage === 'recording' ? stopRecording : record}
        >
          {stage === 'recording' ? <Square size={19} /> : <Mic size={20} />}
          {stage === 'recording'
            ? t('Остановить запись', 'Stop recording')
            : t('Записать голос', 'Record your voice')}
        </button>
        {audioUrl && (
          <audio
            controls
            src={audioUrl}
            aria-label={t('Прослушать запись', 'Play your recording')}
          />
        )}
        {audio && provider && (
          <button
            className="secondary"
            disabled={stage !== 'idle' || !!result}
            onClick={assess}
          >
            <Sparkles size={17} />
            {provider === 'local'
              ? t('Проанализировать локально', 'Assess on this device')
              : t(
                  'Проанализировать в Azure Speech',
                  'Assess with Azure Speech',
                )}
          </button>
        )}
        <p className="status" role="status">
          {error ||
            (stage === 'recording'
              ? t('Идёт запись…', 'Recording…')
              : stage === 'analysis'
                ? t('Идёт анализ записи…', 'Assessing your recording…')
                : !provider
                  ? t(
                      'В деморежиме запись можно прослушать. Фонетический анализ требует подключения отдельного сервиса.',
                      'In demo mode you can play the recording. Pronunciation assessment requires a connected service.',
                    )
                  : '')}
        </p>
      </section>
      {result && (
        <section className="panel assessment" aria-live="polite">
          <h2>{t('Обратная связь', 'Feedback')}</h2>
          <p>
            {missed
              ? `${t('Попробуй ещё раз произнести слово', 'Try saying this word again')} “${missed.word}”.`
              : weakest
                ? `${t('Послушай и повтори слово', 'Listen and repeat the word')} “${weakest.word}”.`
                : t(
                    'Хорошая работа! Попробуй ещё одну фразу.',
                    'Good work! Try another phrase.',
                  )}
          </p>
          {(missed || weakest) && (
            <button
              className="secondary"
              onClick={() => listen((missed ?? weakest)!.word)}
            >
              <Volume2 size={17} />
              {t('Послушать слово', 'Hear the word')}
            </button>
          )}
          {showScores && (
            <>
              <p>
                {t('Точность', 'Accuracy')}{' '}
                <strong>{Math.round(result.accuracy)} / 100</strong>
                {result.fluency != null &&
                  ` · ${t('Беглость', 'Fluency')} ${Math.round(result.fluency)}`}
                {result.completeness != null &&
                  ` · ${t('Полнота', 'Completeness')} ${Math.round(result.completeness)}`}
              </p>
              <ul className="word-scores">
                {result.words.map((word, index) => (
                  <li key={index}>
                    <strong lang="en">{word.word}</strong>{' '}
                    {word.omitted
                      ? t('пропущено', 'omitted')
                      : word.score != null
                        ? Math.round(word.score)
                        : '—'}
                    {word.phonemes.length > 0 && (
                      <small>
                        {word.phonemes
                          .map(
                            (phoneme) =>
                              `${phoneme.symbol} ${Math.round(phoneme.score)}`,
                          )
                          .join(' · ')}
                      </small>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="status">
            {result.provider === 'local'
              ? t(
                  'Автоматическая оценка Pronunciada для этой записи.',
                  'Automated Pronunciada assessment for this recording.',
                )
              : t(
                  'Автоматическая оценка Azure Speech для этой записи.',
                  'Automated Azure Speech assessment for this recording.',
                )}
          </p>
        </section>
      )}
    </div>
  )
}
