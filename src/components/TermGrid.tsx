import { useState } from 'react'
import { PrerequisiteFlowModal } from './PrerequisiteFlowModal'
import type { CourseApiData, StoredScheduleCourse, TermPlan } from '../types'

interface TermGridProps {
  terms: TermPlan[]
  startingCredits: number
  completedCodes: string[]
  inProgressCodes: string[]
  onToggleCoop: (termId: string) => void
  onMoveCourseToTerm: (courseId: string, targetTermId: string) => void
  apiCache: Record<string, CourseApiData>
}

const courseUnits = (courses: StoredScheduleCourse[]) =>
  courses.reduce((sum, course) => sum + course.units, 0)

export const TermGrid = ({
  terms,
  startingCredits,
  completedCodes,
  inProgressCodes,
  onToggleCoop,
  onMoveCourseToTerm,
  apiCache,
}: TermGridProps) => {
  const [infoCourseId, setInfoCourseId] = useState<string | null>(null)
  const [dragCourseId, setDragCourseId] = useState<string | null>(null)
  const [activeDropTermId, setActiveDropTermId] = useState<string | null>(null)
  const infoCourse =
    infoCourseId === null
      ? null
      : terms.flatMap((term) => term.courses).find((course) => course.id === infoCourseId) ?? null
  const infoCourseMetadata = infoCourse ? apiCache[infoCourse.code] : null

  return (
    <>
      <div className="term-grid">
        {terms.map((term, index) => {
          const termTotal = courseUnits(term.courses)
          const runningTotal =
            startingCredits +
            terms
              .slice(0, index + 1)
              .reduce((sum, currentTerm) => sum + courseUnits(currentTerm.courses), 0)

          return (
            <article className="term-card" key={term.id}>
              <div className="term-card-header">
                <div>
                  <h3>
                    {term.season} {term.year}
                  </h3>
                  {index === 0 ? (
                    <p className="muted">Reserved for currently enrolled courses</p>
                  ) : null}
                </div>
                <button
                  className={`coop-toggle ${term.isCoop ? 'coop-toggle-active' : ''}`}
                  onClick={() => onToggleCoop(term.id)}
                  type="button"
                >
                  Co-op
                </button>
              </div>

              <div
                className={`term-course-list ${!term.isCoop ? 'term-dropzone' : ''} ${
                  activeDropTermId === term.id ? 'term-dropzone-active' : ''
                }`}
                onDragEnter={(event) => {
                  if (term.isCoop || !dragCourseId) {
                    return
                  }

                  event.preventDefault()
                  setActiveDropTermId(term.id)
                }}
                onDragLeave={(event) => {
                  if (activeDropTermId !== term.id) {
                    return
                  }

                  const nextTarget = event.relatedTarget

                  if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
                    return
                  }

                  setActiveDropTermId(null)
                }}
                onDragOver={(event) => {
                  if (!term.isCoop) {
                    event.preventDefault()
                    if (dragCourseId && activeDropTermId !== term.id) {
                      setActiveDropTermId(term.id)
                    }
                  }
                }}
                onDrop={(event) => {
                  const courseId = event.dataTransfer.getData('text/plain')

                  if (!courseId || term.isCoop) {
                    return
                  }

                  event.preventDefault()
                  setActiveDropTermId(null)
                  onMoveCourseToTerm(courseId, term.id)
                }}
              >
                {term.isCoop ? (
                  <div className="slot-empty coop-message">Co-op term selected</div>
                ) : null}

                {!term.isCoop && term.courses.length === 0 ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div className="slot-empty" key={`${term.id}-slot-${index}`}>
                      Empty Slot
                    </div>
                  ))
                ) : null}

                {!term.isCoop
                  ? term.courses.map((course) => (
                      <div
                        className={`scheduled-course ${
                          course.source !== 'current' ? 'scheduled-course-draggable' : ''
                        } ${dragCourseId === course.id ? 'scheduled-course-dragging' : ''} ${
                          dragCourseId && dragCourseId !== course.id ? 'scheduled-course-dimmed' : ''
                        }`}
                        draggable={course.source !== 'current'}
                        key={course.id}
                        onDragStart={(event) => {
                          if (course.source === 'current') {
                            event.preventDefault()
                            return
                          }

                          event.dataTransfer.setData('text/plain', course.id)
                          event.dataTransfer.effectAllowed = 'move'
                          setDragCourseId(course.id)
                        }}
                        onDragEnd={() => {
                          setDragCourseId(null)
                          setActiveDropTermId(null)
                        }}
                      >
                        <div className="scheduled-course-content">
                          <strong>{course.code}</strong>
                          <p>
                            {course.title} · {course.units} units
                          </p>
                          {course.source === 'current' ? (
                            <p className="muted">Currently enrolled</p>
                          ) : null}
                        </div>
                        <div className="scheduled-course-actions">
                          {course.source !== 'placeholder' ? (
                            <button
                              aria-label={`Show prerequisite flow for ${course.code}`}
                              className="info-icon-button"
                              onClick={() => setInfoCourseId(course.id)}
                              onDragStart={(event) => event.preventDefault()}
                              type="button"
                              draggable={false}
                            >
                              i
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  : null}
              </div>

              <div className="term-footer">
                <span>Term: {termTotal}</span>
                <span>Total: {runningTotal}</span>
              </div>
            </article>
          )
        })}
      </div>

      <PrerequisiteFlowModal
        corequisiteText={infoCourseMetadata?.corequisites ?? ''}
        completedCodes={completedCodes}
        courseCode={infoCourse?.code ?? ''}
        courseTitle={infoCourse?.title ?? ''}
        inProgressCodes={inProgressCodes}
        isOpen={Boolean(infoCourse)}
        onClose={() => setInfoCourseId(null)}
        prerequisiteText={infoCourseMetadata?.prerequisites ?? infoCourse?.prerequisites ?? ''}
      />
    </>
  )
}
