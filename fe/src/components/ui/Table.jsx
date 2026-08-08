// components/ui/Table.jsx
import { cn } from '../../utils/classNames.js'

export function Table({
  columns = [],
  data = [],
  keyField = 'id',
  className = '',
  emptyMessage = 'No data available',
  renderRow,
  striped = true,
  hover = true,
  ...props
}) {
  if (data.length === 0) {
    return (
      <div className={cn('table-container', className)}>
        <div className="p-8 text-center text-text-secondary">
          {emptyMessage}
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn('table-container overflow-x-auto', className)}>
      <table className="table w-full" {...props}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn(col.className)} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row[keyField] || rowIndex} className={cn(striped && rowIndex % 2 === 1 && 'bg-bg-tertiary/30')}>
              {columns.map((col) => (
                <td key={col.key} className={cn(col.className)}>
                  {col.render ? col.render(row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function VirtualizedTableRow({ columns, rowData, rowIndex, striped = true }) {
  return (
    <tr className={cn(striped && rowIndex % 2 === 1 && 'bg-bg-tertiary/30')}>
      {columns.map((col) => (
        <td key={col.key} className={cn(col.className)}>
          {col.render ? col.render(rowData, rowIndex) : rowData[col.key]}
        </td>
      ))}
    </tr>
  )
}