import { useState } from 'react'
import type { TransferCreditEntry, WqbTag } from '../types'

interface TransferCreditEditorProps {
  transferCredits: TransferCreditEntry[]
  onAddTransferCredit: (entry: Omit<TransferCreditEntry, 'id'>) => void
  onToggleCompleted: (id: string) => void
  onRemove: (id: string) => void
}

const WQB_OPTIONS: WqbTag[] = ['W', 'Q', 'B-Hum', 'B-Soc', 'B-Sci']

export const TransferCreditEditor = ({
  transferCredits,
  onAddTransferCredit,
  onToggleCompleted,
  onRemove,
}: TransferCreditEditorProps) => {
  const [title, setTitle] = useState('')
  const [units, setUnits] = useState('3')
  const [requirementArea, setRequirementArea] = useState<'transfer' | 'groupA' | 'groupB'>(
    'transfer'
  )
  const [designations, setDesignations] = useState<WqbTag[]>([])

  const toggleDesignation = (tag: WqbTag) => {
    setDesignations((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    )
  }

  const handleAdd = () => {
    if (!title.trim()) {
      return
    }

    onAddTransferCredit({
      title: title.trim(),
      units: Number(units) || 0,
      completed: true,
      designations,
      requirementArea,
    })

    setTitle('')
    setUnits('3')
    setRequirementArea('transfer')
    setDesignations([])
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h3>Transfer Credits</h3>
          <p>Import generic transfer credits and manually designate WQB tags when needed.</p>
        </div>
      </div>

      <div className="transfer-form">
        <input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Transfer credit label"
          value={title}
        />
        <input
          min="0"
          onChange={(event) => setUnits(event.target.value)}
          placeholder="Units"
          type="number"
          value={units}
        />
        <select
          onChange={(event) =>
            setRequirementArea(event.target.value as 'transfer' | 'groupA' | 'groupB')
          }
          value={requirementArea}
        >
          <option value="transfer">General transfer credit</option>
          <option value="groupA">Counts toward Group A</option>
          <option value="groupB">Counts toward Group B</option>
        </select>
        <button onClick={handleAdd} type="button">
          Add transfer credit
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

      <div className="course-table">
        {transferCredits.map((credit) => (
          <div className={`course-row ${credit.completed ? 'course-row-complete' : ''}`} key={credit.id}>
            <div className="course-row-main">
              <label className="status-toggle">
                <input
                  checked={credit.completed}
                  onChange={() => onToggleCompleted(credit.id)}
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
            <button onClick={() => onRemove(credit.id)} type="button">
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
