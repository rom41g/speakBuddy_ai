import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import type {
  BritishForm,
  BritishPronunciation,
} from '../shared/britishDictionary'
import type { Translate } from './App'
import { playDictionaryAudio } from './dictionaryAudio'
import { stopSpeaking } from './speech'

function WordAudio({
  form,
  word,
  t,
}: {
  form: BritishForm
  word: string
  t: Translate
}) {
  const [error, setError] = useState(false)
  return (
    <span className="dictionary-audio">
      <button
        className="icon-button"
        type="button"
        aria-label={`${t('Словарное аудио', 'Dictionary audio')} ${word} /${form.ipa}/`}
        onClick={() => {
          stopSpeaking()
          void playDictionaryAudio(form).then((status) =>
            setError(status === 'blocked' || status === 'unavailable'),
          )
        }}
      >
        <Volume2 size={17} />
      </button>
      {error && (
        <span role="status">
          {t('Не удалось воспроизвести аудио.', 'Could not play the audio.')}
        </span>
      )}
    </span>
  )
}

export default function DictionaryCard({
  entry,
  t,
}: {
  entry: BritishPronunciation
  t: Translate
}) {
  const senses = {
    base: t('начальная форма', 'base form'),
    past: t('прошедшее время', 'past tense'),
    noun: t('существительное', 'noun'),
    verb: t('глагол', 'verb'),
  }
  return (
    <div className="dictionary-card">
      <strong lang="en-GB">{entry.word}</strong>
      {entry.ru && (
        <p className="word-translation" lang="ru">
          {entry.ru}
        </p>
      )}
      {entry.forms.length > 0 ? (
        <ul aria-label={t('Британская IPA', 'British IPA')}>
          {entry.forms.map((form) => (
            <li key={form.ipa}>
              <span className="uk-ipa">UK</span>{' '}
              <span className="ipa">/{form.ipa}/</span>
              {form.sense && <small>{senses[form.sense]}</small>}
              {form.file && (
                <WordAudio form={form} word={entry.word} t={t} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {t(
            'Открой словарную статью, чтобы посмотреть IPA и послушать вариант UK.',
            'Open the dictionary to see the IPA and hear UK pronunciation.',
          )}
        </p>
      )}
      <a href={entry.url} target="_blank" rel="noopener noreferrer">
        {entry.source === 'composed'
          ? t(
              'IPA составлена по словарным формам',
              'IPA composed from dictionary forms',
            )
          : entry.source === 'phonemized'
            ? t('Британские фонемы eSpeak NG', 'eSpeak NG British phonemes')
            : entry.source === 'wiktionary'
              ? 'Wiktionary'
              : 'Cambridge Dictionary'}
      </a>
    </div>
  )
}
