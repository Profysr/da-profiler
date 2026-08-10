import { Plus, Trash2 } from 'lucide-react';

export function Table({ columns, children, footerAction, "data-label": testId = "table" }) {
  return (
    <div className="border border-outline-variant rounded-md overflow-hidden bg-surface overflow-x-auto w-full" data-label={testId}>
      <table className="w-full text-left border-collapse min-w-[500px]" data-label={`${testId}-table`}>
        <thead>
          <tr className="bg-surface-variant/50 border-b border-outline-variant" data-label={`${testId}-thead`}>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`px-4 py-2 font-label-caps text-label-caps text-on-surface-variant ${col.className || ''}`}
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

export function ParamTable({ params, onUpdate, onDelete, onAdd, "data-label": testId = "param-table" }) {
  const columns = [
    { label: 'Key', className: 'w-1/4' },
    { label: 'Value', className: 'w-1/4' },
    { label: 'Description', className: 'w-auto' },
    { label: '', className: 'w-10' }
  ];

  const AddButton = (
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 text-label-caps font-label-caps text-primary hover:bg-primary/10 px-2.5 py-1 rounded transition-colors font-semibold"
      data-label={`${testId}-add-btn`}
    >
      <Plus className="w-3.5 h-3.5" /> Add Param
    </button>
  );

  return (
    <Table columns={columns} footerAction={AddButton} data-label={testId}>
      {params.map((param) => (
        <tr key={param.id} className="border-b border-outline-variant/50" data-label={`${testId}-row-${param.id}`} data-param-id={param.id}>
          <td className="px-4 py-2" data-label={`${testId}-cell-key`}>
            <input
              className="bg-transparent border-none outline-none text-primary font-code-sm w-full p-0 focus:ring-0"
              type="text"
              value={param.key}
              onChange={(e) => onUpdate(param.id, 'key', e.target.value)}
              data-label={`${testId}-input-key-${param.id}`}
            />
          </td>
          <td className="px-4 py-2" data-label={`${testId}-cell-value`}>
            <input
              className="bg-transparent border-none outline-none text-on-surface font-code-sm w-full p-0 focus:ring-0"
              type="text"
              value={param.value}
              onChange={(e) => onUpdate(param.id, 'value', e.target.value)}
              data-label={`${testId}-input-value-${param.id}`}
            />
          </td>
          <td className="px-4 py-2" data-label={`${testId}-cell-desc`}>
            <input
              className="bg-transparent border-none outline-none text-on-surface-variant font-code-sm w-full p-0 focus:ring-0"
              type="text"
              value={param.desc}
              onChange={(e) => onUpdate(param.id, 'desc', e.target.value)}
              data-label={`${testId}-input-desc-${param.id}`}
            />
          </td>
          <td className="px-4 py-2 text-right" data-label={`${testId}-cell-delete`}>
            <button
              onClick={() => onDelete(param.id)}
              className="text-on-surface-variant hover:text-error transition-colors p-1 rounded hover:bg-surface-variant"
              data-label={`${testId}-delete-btn-${param.id}`}
              title="Delete param"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </td>
        </tr>
      ))}
    </Table>
  );
}