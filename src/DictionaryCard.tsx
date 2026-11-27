import type { BritishPronunciation } from '../shared/britishDictionary'
import type { Translate } from './App'

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
      {entry.forms.length > 0 ? (
        <ul aria-label={t('Британская IPA', 'British IPA')}>
          {entry.forms.map(({ ipa, sense }) => (
            <li key={ipa}>
              <span className="uk-ipa">UK</span>{' '}
              <span className="ipa">/{ipa}/</span>
              {sense && <small>{senses[sense]}</small>}
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
        Cambridge Dictionary
      </a>
    </div>
  )
}
