import { useState } from 'react'
import { searchOutlines } from '../lib/sfuApi'
import type { OutlineLookupResult, RequirementArea } from '../types'

interface CourseLookupProps {
  onAddCourse: (
    result: OutlineLookupResult,
    requirementArea: 'custom' | 'groupA' | 'groupB'
  ) => void
}

export const CourseLookup = ({ onAddCourse }: CourseLookupProps) => {
  const [department, setDepartment] = useState('')
  const [number, setNumber] = useState('')
  const [results, setResults] = useState<OutlineLookupResult[]>([])
  const [requirementArea, setRequirementArea] = useState<
    Extract<RequirementArea, 'custom' | 'groupA' | 'groupB'>
  >('custom')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    setLoading(true)
    setError('')

    try {
      const outlines = await searchOutlines(department, number)
      setResults(outlines)
      if (outlines.length === 0) {
        setError('No matching SFU outlines were found.')
      }
    } catch {
      setError('Lookup failed. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h3>Lookup Other Courses</h3>
          <p>Add courses from other departments and choose whether they count as Group A, Group B, or general planning credit.</p>
        </div>
      </div>

      <div className="lookup-controls">
        <input
          onChange={(event) => setDepartment(event.target.value.toUpperCase())}
          placeholder="Department (e.g. ECON)"
          value={department}
        />
        <input
          onChange={(event) => setNumber(event.target.value.toUpperCase())}
          placeholder="Number (e.g. 201)"
          value={number}
        />
        <select
          onChange={(event) =>
            setRequirementArea(event.target.value as 'custom' | 'groupA' | 'groupB')
          }
          value={requirementArea}
        >
          <option value="custom">General elective / planning</option>
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
              onClick={() => onAddCourse(result, requirementArea)}
              type="button"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
