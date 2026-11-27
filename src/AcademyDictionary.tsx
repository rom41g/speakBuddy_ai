import { useState } from 'react'
import { academyBooks, academyUnitsFor } from '../shared/academy'
import type { AcademyUnit } from '../shared/academy'
import { britishPronunciation } from '../shared/britishDictionary'
import type { Translate } from './App'
import DictionaryCard from './DictionaryCard'

const allTerms = [
  ...new Set(
    academyBooks
      .flatMap(academyUnitsFor)
      .flatMap((unit) =>
        unit.vocabulary.concat(unit.cards.map((card) => card.word)),
      ),
  ),
]
  .map(britishPronunciation)
  .sort((a, b) => a.word.localeCompare(b.word, 'en-GB'))
const searchable = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

export default function AcademyDictionary({
  unit,
  t,
}: {
  unit?: AcademyUnit
  t: Translate
}) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(24)
  const filter = searchable(query.trim())
  const entries = filter
    ? allTerms.filter((entry) =>
        searchable(`${entry.word} ${entry.ru}`).includes(filter),
      )
    : unit
      ? unit.vocabulary.map(britishPronunciation)
      : allTerms

  return (
    <section
      className="dictionary-section"
      aria-label={t('Словарь Academy Stars', 'Academy Stars dictionary')}
    >
      <label htmlFor="dictionary-search">
        {t('Поиск во всех четырёх учебниках', 'Search all four books')}
      </label>
      <input
        id="dictionary-search"
        className="text-field"
        type="search"
        value={query}
        placeholder={t(
          'Английское слово или перевод',
          'English word or Russian translation',
        )}
        onChange={(event) => {
          setQuery(event.target.value)
          setLimit(24)
        }}
      />
      <p className="status" role="status">
        {!entries.length
          ? t('Совпадений нет.', 'No matches.')
          : filter || !unit
            ? `${t('Найдено', 'Results')} ${entries.length}`
            : unit.title}
      </p>
      <ul className="dictionary-grid">
        {entries.slice(0, limit).map((entry) => (
          <li className="panel" key={entry.word}>
            <DictionaryCard entry={entry} t={t} />
          </li>
        ))}
      </ul>
      {entries.length > limit && (
        <button className="secondary" onClick={() => setLimit(limit + 24)}>
          {t('Показать ещё', 'Show more')}
        </button>
      )}
    </section>
  )
}
