import { BookOpen, ChevronDown } from 'lucide-react'
import { academyBooks, academyUnitsFor } from '../shared/academy'
import type { AcademyBook, AcademyUnit } from '../shared/academy'
import type { Translate } from './App'

export default function AcademyPicker({
  unit,
  t,
  change,
  showWords = false,
}: {
  unit?: AcademyUnit
  t: Translate
  change(id: string | null): void
  showWords?: boolean
}) {
  return (
    <section
      className="academy-picker"
      aria-label={t('Материал занятия', 'Lesson material')}
    >
      <div className="academy-selects">
        <div>
          <label htmlFor="academy-book">
            <BookOpen size={16} /> {t('Учебник', 'Course book')}
          </label>
          <div className="select-wrap">
            <select
              id="academy-book"
              value={unit?.book ?? ''}
              onChange={(event) => {
                const book = Number(event.target.value) as AcademyBook
                change(
                  academyBooks.includes(book)
                    ? academyUnitsFor(book)[0].id
                    : null,
                )
              }}
            >
              {academyBooks.map((book) => (
                <option key={book} value={book}>
                  Academy Stars {book}
                </option>
              ))}
              <option value="">
                {t('Свободная практика', 'Free practice')}
              </option>
            </select>
            <ChevronDown size={17} />
          </div>
        </div>
        {unit && (
          <div>
            <label htmlFor="academy-unit">{t('Юнит', 'Unit')}</label>
            <div className="select-wrap">
              <select
                id="academy-unit"
                value={unit.id}
                onChange={(event) => change(event.target.value)}
              >
                {academyUnitsFor(unit.book).map((item) => (
                  <option key={item.id} value={item.id} lang="en">
                    {item.number}. {item.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} />
            </div>
          </div>
        )}
      </div>
      {unit && (
        <p className="academy-source">
          <strong>{t(unit.theme.ru, unit.theme.en)}</strong>
          <span>
            <span lang="en">Pupil’s Book</span> · {t('с.', 'pp.')}{' '}
            {unit.page - 1}–{unit.page}
          </span>
        </p>
      )}
      {unit && showWords && (
        <ul
          className="academy-words"
          lang="en"
          aria-label={t('Слова юнита', 'Unit vocabulary')}
        >
          {unit.vocabulary.map((word) => (
            <li key={word}>{word}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
