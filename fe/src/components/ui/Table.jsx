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