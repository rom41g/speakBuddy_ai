import { useState } from 'react'
import { Check, GraduationCap } from 'lucide-react'
import { academyBooks } from '../shared/academy'
import type { AcademyBook } from '../shared/academy'
import { academyLevels } from '../shared/chatLevel'
import type { Translate } from './App'

export type Student = { nickname: string; book: AcademyBook | null; skipped?: boolean }

export default function StudentRegistration({ student, save, skip, t }: {
  student: Student
  save(student: Student): void
  skip(): void
  t: Translate
}) {
  const [nickname, setNickname] = useState(student.nickname)
  const [book, setBook] = useState(student.book)

  return (
    <form className="panel student-form" onSubmit={(event) => {
      event.preventDefault()
      if (book) save({ nickname: nickname.trim(), book })
    }}>
      <label className="student-name" htmlFor="student-nickname">
        {t('Имя или псевдоним (необязательно)', 'Name or nickname (optional)')}
        <input
          className="text-field"
          id="student-nickname"
          value={nickname}
          maxLength={32}
          autoComplete="off"
          onChange={(event) => setNickname(event.target.value)}
        />
      </label>
      <fieldset className="student-books">
        <legend>{t('Выбери свой учебник', 'Choose your book')}</legend>
        <p>{t('Бадди подберёт слова и сложность ответов по твоему учебнику.', 'Buddy will use words and sentences that fit your book.')}</p>
        <div className="student-book-grid">
          {academyBooks.map((number) => (
            <label className="student-book" key={number}>
              <input
                type="radio"
                name="student-book"
                checked={book === number}
                onChange={() => setBook(number)}
                required
              />
              <span className="student-book-card">
                <img
                  src={`${import.meta.env.BASE_URL}book-covers/academy-stars-${number}.webp`}
                  alt=""
                />
                <strong lang="en">Academy Stars {number}</strong>
                <span>{academyLevels[number]}</span>
                <Check className="student-book-check" aria-hidden="true" size={18} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="student-actions">
        <button className="primary" type="submit" disabled={!book}>
          <GraduationCap size={19} /> {t('Сохранить профиль', 'Save profile')}
        </button>
        <button className="secondary" type="button" onClick={skip}>
          {student.book ? t('Закрыть', 'Close') : t('Продолжить как гость', 'Continue as a guest')}
        </button>
      </div>
      <p className="status">{t('Профиль хранится в этом браузере.', 'Your profile is saved in this browser.')}</p>
    </form>
  )
}
