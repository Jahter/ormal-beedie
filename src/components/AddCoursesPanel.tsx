import { useState } from 'react'
import { searchOutlines } from '../lib/sfuApi'
import type {
  CustomCourseEntry,
  OutlineLookupResult,
  RequirementArea,
  TransferCreditEntry,
  WqbTag,
} from '../types'

type AddMode = 'lookup' | 'transfer'

interface AddCoursesPanelProps {
  /* SFU lookup */
  onAddLookupCourse: (
    result: OutlineLookupResult,
    requirementArea: Extract<RequirementArea, 'custom' | 'groupA' | 'groupB'>
  ) => void
  customCourses: CustomCourseEntry[]
  inProgressCodes: string[]
  onToggleCustomCourse: (id: string) => void
  onToggleCustomCourseInProgress: (id: string) => void
  onRemoveCustomCourse: (id: string) => void

  /* Transfer credits */
  transferCredits: TransferCreditEntry[]
  onAddTransferCredit: (entry: Omit<TransferCreditEntry, 'id'>) => void
  onToggleTransferCredit: (id: string) => void
  onRemoveTransferCredit: (id: string) => void
}

const WQB_OPTIONS: WqbTag[] = ['W', 'Q', 'B-Hum', 'B-Soc', 'B-Sci']

export const AddCoursesPanel = ({
  onAddLookupCourse,
  customCourses,
  inProgressCodes,
  onToggleCustomCourse,
  onToggleCustomCourseInProgress,
  onRemoveCustomCourse,
  transferCredits,
  onAddTransferCredit,
  onToggleTransferCredit,
  onRemoveTransferCredit,
}: AddCoursesPanelProps) => {
  const [mode, setMode] = useState<AddMode>('lookup')

  /* ── Lookup state ─────────────────────────────────────────── */
  const [department, setDepartment] = useState('')
  const [number, setNumber] = useState('')
  const [lookupArea, setLookupArea] = useState<'custom' | 'groupA' | 'groupB'>('custom')
  const [results, setResults] = useState<OutlineLookupResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    setLoading(true)
    setError('')
    try {
      const outlines = await searchOutlines(department, number)
      setResults(outlines)
      if (outlines.length === 0) setError('No matching SFU outlines were found.')
    } catch {
      setError('Lookup failed. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Transfer state ───────────────────────────────────────── */
  const [title, setTitle] = useState('')
  const [units, setUnits] = useState('3')
  const [transferArea, setTransferArea] = useState<'transfer' | 'groupA' | 'groupB'>('transfer')
  const [designations, setDesignations] = useState<WqbTag[]>([])

  const toggleDesignation = (tag: WqbTag) =>
    setDesignations((cur) =>
      cur.includes(tag) ? cur.filter((v) => v !== tag) : [...cur, tag]
    )

  const handleAddTransfer = () => {
    if (!title.trim()) return
    onAddTransferCredit({
      title: title.trim(),
      units: Number(units) || 0,
      completed: true,
      designations,
      requirementArea: transferArea,
    })
    setTitle('')
    setUnits('3')
    setTransferArea('transfer')
    setDesignations([])
  }

  /* ── Merged course list ───────────────────────────────────── */
  const allCourses: Array<
    | { type: 'lookup'; data: CustomCourseEntry }
    | { type: 'transfer'; data: TransferCreditEntry }
  > = [
    ...customCourses.map((c) => ({ type: 'lookup' as const, data: c })),
    ...transferCredits.map((c) => ({ type: 'transfer' as const, data: c })),
  ]

  return (
    <section className="panel side-panel">
      <div className="panel-heading">
        <div>
          <h3>Add Courses</h3>
          <p>Search SFU courses or add transfer credits to your plan.</p>
        </div>
      </div>

      {/* ── Mode toggle ─────────────────────────────────────── */}
      <div className="add-mode-toggle">
        <button
          className={`add-mode-btn ${mode === 'lookup' ? 'add-mode-btn-active' : ''}`}
          onClick={() => setMode('lookup')}
          type="button"
        >
          SFU Course Lookup
        </button>
        <button
          className={`add-mode-btn ${mode === 'transfer' ? 'add-mode-btn-active' : ''}`}
          onClick={() => setMode('transfer')}
          type="button"
        >
          Transfer Credit
        </button>
      </div>

      {/* ── Lookup form ─────────────────────────────────────── */}
      {mode === 'lookup' ? (
        <div className="add-form-section">
          <div className="lookup-controls">
            <input
              onChange={(e) => setDepartment(e.target.value.toUpperCase())}
              placeholder="Department (e.g. ECON)"
              value={department}
            />
            <input
              onChange={(e) => setNumber(e.target.value.toUpperCase())}
              placeholder="Number (e.g. 201)"
              value={number}
            />
            <select
              onChange={(e) =>
                setLookupArea(e.target.value as 'custom' | 'groupA' | 'groupB')
              }
              value={lookupArea}
            >
              <option value="custom">General elective</option>
              <option value="groupA">Group A</option>
              <option value="groupB">Group B</option>
            </select>
            <button onClick={handleSearch} type="button">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {error ? <p className="muted">{error}</p> : null}

          <div className="lookup-results">
            {results.map((result) => (
              <div className="lookup-result" key={result.code}>
                <div>
                  <strong>
                    {result.code} · {result.title}
                  </strong>
                  <p>
                    {result.units} units
                    {result.designationText ? ` · ${result.designationText}` : ''}
                  </p>
                  {result.prerequisites ? (
                    <p className="muted">Prereqs: {result.prerequisites}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => onAddLookupCourse(result, lookupArea)}
                  type="button"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Transfer form ───────────────────────────────────── */}
      {mode === 'transfer' ? (
        <div className="add-form-section">
          <div className="transfer-form">
            <input
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course label (e.g. CMNS 1XX)"
              value={title}
            />
            <input
              min="0"
              onChange={(e) => setUnits(e.target.value)}
              placeholder="Units"
              type="number"
              value={units}
            />
            <select
              onChange={(e) =>
                setTransferArea(e.target.value as 'transfer' | 'groupA' | 'groupB')
              }
              value={transferArea}
            >
              <option value="transfer">General transfer</option>
              <option value="groupA">Group A</option>
              <option value="groupB">Group B</option>
            </select>
            <button onClick={handleAddTransfer} type="button">
              Add
            </button>
          </div>

          <div className="tag-list">
            {WQB_OPTIONS.map((tag) => (
              <label className="tag-pill" key={tag}>
                <input
                  checked={designations.includes(tag)}
                  onChange={() => toggleDesignation(tag)}
                  type="checkbox"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Unified course list ─────────────────────────────── */}
      {allCourses.length > 0 ? (
        <>
          <div className="added-courses-divider">
            <span>Added Courses ({allCourses.length})</span>
          </div>
          <div className="course-table">
            {allCourses.map((entry) => {
              if (entry.type === 'lookup') {
                const course = entry.data
                const inProg = inProgressCodes.includes(course.code)
                return (
                  <div
                    className={`course-row ${course.completed ? 'course-row-complete' : ''} ${inProg ? 'course-row-progress' : ''}`}
                    key={`lookup-${course.id}`}
                  >
                    <div className="course-row-main">
                      <label className="status-toggle">
                        <input
                          checked={course.completed}
                          onChange={() => onToggleCustomCourse(course.id)}
                          type="checkbox"
                        />
                        <span
                          className={`status-toggle-indicator ${inProg ? 'status-toggle-indicator-progress' : ''}`}
                        />
                      </label>
                      <div>
                        <strong>
                          {course.code} · {course.title}
                        </strong>
                        <p>
                          {course.units} units · {course.requirementArea}
                          {course.designations.length > 0
                            ? ` · ${course.designations.join(', ')}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="inline-actions">
                      <button
                        onClick={() => onToggleCustomCourseInProgress(course.id)}
                        type="button"
                      >
                        {inProg ? 'In Progress' : 'Mark In Progress'}
                      </button>
                      <button
                        onClick={() => onRemoveCustomCourse(course.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              }
              const credit = entry.data
              return (
                <div
                  className={`course-row ${credit.completed ? 'course-row-complete' : ''}`}
                  key={`transfer-${credit.id}`}
                >
                  <div className="course-row-main">
                    <label className="status-toggle">
                      <input
                        checked={credit.completed}
                        onChange={() => onToggleTransferCredit(credit.id)}
                        type="checkbox"
                      />
                      <span className="status-toggle-indicator" />
                    </label>
                    <div>
                      <strong>{credit.title}</strong>
                      <p>
                        {credit.units} units · {credit.requirementArea}
                        {credit.designations.length > 0
                          ? ` · ${credit.designations.join(', ')}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveTransferCredit(credit.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          No courses added yet.
        </p>
      )}
    </section>
  )
}
