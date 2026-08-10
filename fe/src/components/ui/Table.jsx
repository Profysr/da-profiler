import { Plus, Trash2 } from 'lucide-react';

export function Table({ columns, children, footerAction, "data-label": testId = "table" }) {
  return (
    <div className="border border-outline-variant rounded-md overflow-hidden bg-surface overflow-x-auto w-full" data-label={testId}>
      <table className="w-full text-left border-collapse min-w-[300px]" data-label={`${testId}-table`}>
        <thead>
          <tr className="bg-surface-variant/50 border-b border-outline-variant" data-label={`${testId}-thead`}>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`px-3 py-2 font-label-caps text-[10px] tracking-widest uppercase text-on-surface-variant ${col.className || ''}`}
                data-label={`${testId}-th-${col.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-code-sm text-code-sm" data-label={`${testId}-tbody`}>
          {children}
        </tbody>
      </table>

      {footerAction && (
        <div className="p-2 bg-surface-container-low border-t border-outline-variant" data-label={`${testId}-footer`}>
          {footerAction}
        </div>
      )}
    </div>
  );
}

/**
 * ParamTable — reusable editable key/value table for path and query params.
 * Description column intentionally omitted per UX requirements.
 */
export function ParamTable({ params, onUpdate, onDelete, onAdd, "data-label": testId = "param-table" }) {
  const columns = [
    { label: 'Key',   className: 'w-2/5' },
    { label: 'Value', className: 'w-2/5' },
    { label: '',      className: 'w-[40px]' },
  ];

  const AddButton = (
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded transition-colors"
      data-label={`${testId}-add-btn`}
      type="button"
    >
      <Plus className="w-3.5 h-3.5" />
      Add Param
    </button>
  );

  return (
    <Table columns={columns} footerAction={AddButton} data-label={testId}>
      {params.map((param) => (
        <tr
          key={param.id}
          className="border-b border-outline-variant/40 hover:bg-surface-variant/10 transition-colors"
          data-label={`${testId}-row-${param.id}`}
          data-param-id={param.id}
        >
          {/* Key cell */}
          <td className="px-2 py-1.5" data-label={`${testId}-cell-key`}>
            <input
              className="w-full px-2 py-1 rounded border border-outline-variant bg-surface-container text-primary font-mono text-[12px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors placeholder:text-on-surface-variant/40"
              type="text"
              value={param.key}
              onChange={(e) => onUpdate(param.id, 'key', e.target.value)}
              placeholder="key"
              data-label={`${testId}-input-key-${param.id}`}
            />
          </td>

          {/* Value cell */}
          <td className="px-2 py-1.5" data-label={`${testId}-cell-value`}>
            <input
              className="w-full px-2 py-1 rounded border border-outline-variant bg-surface-container text-on-surface font-mono text-[12px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors placeholder:text-on-surface-variant/40"
              type="text"
              value={param.value}
              onChange={(e) => onUpdate(param.id, 'value', e.target.value)}
              placeholder="value"
              data-label={`${testId}-input-value-${param.id}`}
            />
          </td>

          {/* Delete button */}
          <td className="px-2 py-1.5 text-center" data-label={`${testId}-cell-delete`}>
            <button
              onClick={() => onDelete(param.id)}
              className="text-on-surface-variant hover:text-error transition-colors p-1 rounded hover:bg-error/10"
              data-label={`${testId}-delete-btn-${param.id}`}
              title="Remove param"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </td>
        </tr>
      ))}
    </Table>
  );
}