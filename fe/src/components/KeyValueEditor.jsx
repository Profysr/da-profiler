// src/components/KeyValueEditor.jsx
import { Plus, Trash2 } from 'lucide-react'

export function KeyValueEditor({
  pairs = [],
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  descriptionPlaceholder = 'Description',
  showDescription = true,
}) {
  const handleUpdate = (index, field, val) => {
    const updated = [...pairs]
    updated[index] = { ...updated[index], [field]: val }
    onChange?.(updated)
  }

  const handleToggle = (index) => {
    const updated = [...pairs]
    updated[index] = { ...updated[index], enabled: !updated[index].enabled }
    onChange?.(updated)
  }

  const handleAdd = () => {
    onChange?.([...pairs, { enabled: true, key: '', value: '', description: '' }])
  }

  const handleRemove = (index) => {
    const updated = pairs.filter((_, i) => i !== index)
    onChange?.(updated)
  }

  return (
    <div className="space-y-2 select-none">
      <div className="border border-outline-variant rounded overflow-hidden bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-caps uppercase text-[10px]">
              <th className="p-2 w-8 text-center border-r border-outline-variant">✓</th>
              <th className="p-2 border-r border-outline-variant">{keyPlaceholder}</th>
              <th className="p-2 border-r border-outline-variant">{valuePlaceholder}</th>
              {showDescription && <th className="p-2 border-r border-outline-variant">{descriptionPlaceholder}</th>}
              <th className="p-2 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50 font-mono text-xs">
            {pairs.map((row, idx) => (
              <tr key={idx} className={row.enabled ? 'bg-surface' : 'bg-surface-container-low/40 opacity-60'}>
                <td className="p-1 text-center border-r border-outline-variant">
                  <input
                    type="checkbox"
                    checked={row.enabled ?? true}
                    onChange={() => handleToggle(idx)}
                    className="rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="p-1 border-r border-outline-variant">
                  <input
                    type="text"
                    value={row.key || ''}
                    onChange={(e) => handleUpdate(idx, 'key', e.target.value)}
                    placeholder={keyPlaceholder}
                    className="w-full bg-transparent px-1.5 py-0.5 focus:outline-none focus:bg-surface-container-high rounded"
                  />
                </td>
                <td className="p-1 border-r border-outline-variant">
                  <input
                    type="text"
                    value={row.value || ''}
                    onChange={(e) => handleUpdate(idx, 'value', e.target.value)}
                    placeholder={valuePlaceholder}
                    className="w-full bg-transparent px-1.5 py-0.5 focus:outline-none focus:bg-surface-container-high rounded"
                  />
                </td>
                {showDescription && (
                  <td className="p-1 border-r border-outline-variant">
                    <input
                      type="text"
                      value={row.description || ''}
                      onChange={(e) => handleUpdate(idx, 'description', e.target.value)}
                      placeholder={descriptionPlaceholder}
                      className="w-full bg-transparent px-1.5 py-0.5 focus:outline-none focus:bg-surface-container-high rounded font-sans"
                    />
                  </td>
                )}
                <td className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-on-surface-variant hover:text-rose-400 transition-colors"
                    title="Remove row"
                  >
                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Key-Value Pair</span>
      </button>
    </div>
  )
}
