import { useState } from 'react'
import { PrerequisiteFlowModal } from './PrerequisiteFlowModal'
import type { CourseApiData, RequirementGroup } from '../types'

interface CourseChecklistSectionProps {
  group: RequirementGroup
  completedCodes: string[]
  inProgressCodes: string[]
  onToggleCompleted: (code: string) => void
  onToggleInProgress: (code: string) => void
  apiCache: Record<string, CourseApiData>
}

export const CourseChecklistSection = ({
  group,
  completedCodes,
  inProgressCodes,
  onToggleCompleted,
  onToggleInProgress,
  apiCache,
}: CourseChecklistSectionProps) => {
  const completedCount = group.courses.filter((course) =>
    completedCodes.includes(course.code)
  ).length
  const targetCount = group.minRequired ?? group.courses.length
  const [infoCourseCode, setInfoCourseCode] = useState<string | null>(null)

  const infoCourse = infoCourseCode
    ? group.courses.find((course) => course.code === infoCourseCode) ?? null
    : null
  const infoCourseMetadata = infoCourse ? apiCache[infoCourse.code] : null

  return (
    <>
      <section className="checklist-section">
        <div className="checklist-section-heading">
          <div>
            <h3>{group.title}</h3>
            {group.description ? <p>{group.description}</p> : null}
          </div>
          <span className="badge">
            {completedCount}/{targetCount}
          </span>
        </div>

        <div className="checklist-card-grid">
          {group.courses.map((course) => {
            const completed = completedCodes.includes(course.code)
            const inProgress = inProgressCodes.includes(course.code)
            const metadata = apiCache[course.code]
            const designationText = metadata?.designationText
              ? metadata.designationText
              : course.designations?.join(', ')


            return (
              <article
                className={`checklist-course-card ${
                  completed ? 'checklist-course-card-complete' : ''
                } ${inProgress ? 'checklist-course-card-progress' : ''}`}
                key={`${group.id}-${course.code}`}
              >
                <div className="checklist-course-head">
                  <strong>
                    {course.code} ({course.units} Units)
                  </strong>
                  <div className="checklist-course-corner">
                    <button
                      aria-label={`Show prerequisite flow for ${course.code}`}
                      className="info-icon-button"
                      onClick={() => setInfoCourseCode(course.code)}
                      type="button"
                    >
                      i
                    </button>
                    <label className="status-toggle">
                      <input
                        checked={completed || inProgress}
                        onChange={() =>
                          completed
                            ? onToggleCompleted(course.code)
                            : inProgress
                              ? onToggleInProgress(course.code)
                              : onToggleCompleted(course.code)
                        }
                        type="checkbox"
                      />
                      <span
                        className={`status-toggle-indicator ${
                          inProgress ? 'status-toggle-indicator-progress' : ''
                        }`}
                      />
                    </label>
                  </div>
                </div>

                <p className="checklist-course-title">{course.title}</p>

                <div className="checklist-course-meta">
                  {course.optionLabel ? (
                    <span className="mini-tag">{course.optionLabel}</span>
                  ) : null}
                  {designationText ? (
                    <span className="mini-tag">{designationText}</span>
                  ) : null}
                  {inProgress ? (
                    <span className="mini-tag mini-tag-progress">Currently enrolled</span>
                  ) : null}
                </div>


                <div className="course-card-actions">
                  <button
                    className={`checklist-status-button ${
                      completed ? 'checklist-status-button-complete' : ''
                    }`}
                    onClick={() => onToggleCompleted(course.code)}
                    type="button"
                  >
                    {completed ? 'Completed' : 'Mark as Completed'}
                  </button>
                  <button
                    className={`checklist-status-button ${
                      inProgress ? 'checklist-status-button-progress' : ''
                    }`}
                    onClick={() => onToggleInProgress(course.code)}
                    type="button"
                  >
                    {inProgress ? 'Currently In Progress' : 'Mark In Progress'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <PrerequisiteFlowModal
        corequisiteText={infoCourseMetadata?.corequisites ?? ''}
        completedCodes={completedCodes}
        courseCode={infoCourse?.code ?? ''}
        courseTitle={infoCourse?.title ?? ''}
        inProgressCodes={inProgressCodes}
        isOpen={Boolean(infoCourse)}
        onClose={() => setInfoCourseCode(null)}
        prerequisiteText={infoCourseMetadata?.prerequisites ?? ''}
      />
    </>
  )
}
