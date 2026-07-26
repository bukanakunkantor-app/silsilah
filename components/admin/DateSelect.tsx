import { useState, useEffect } from 'react'

interface DateSelectProps {
  id?: string
  value: string
  onChange: (val: string) => void
  maxYear?: number
  minYear?: number
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

export default function DateSelect({ 
  value, 
  onChange, 
  maxYear = new Date().getFullYear(), 
  minYear = 1800, 
  id 
}: DateSelectProps) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    if (value) {
      // Handle YYYY-MM-DD
      const [y, m, d] = value.split('-')
      if (y && m && d) {
        setYear(y)
        setMonth(parseInt(m, 10).toString())
        setDay(parseInt(d, 10).toString())
      }
    } else {
      setYear('')
      setMonth('')
      setDay('')
    }
  }, [value])

  const handleUpdate = (newY: string, newM: string, newD: string) => {
    if (newY && newM && newD) {
      onChange(`${newY}-${newM.padStart(2, '0')}-${newD.padStart(2, '0')}`)
    } else {
      onChange('') // Reset if not fully selected
    }
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <select 
        className="form-select" 
        value={day} 
        onChange={(e) => {
          setDay(e.target.value)
          handleUpdate(year, month, e.target.value)
        }}
        style={{ flex: '1 1 70px', padding: '10px 8px' }}
      >
        <option value="">Tgl</option>
        {days.map(d => (
          <option key={d} value={d.toString()}>{d}</option>
        ))}
      </select>
      
      <select 
        className="form-select" 
        value={month} 
        onChange={(e) => {
          setMonth(e.target.value)
          handleUpdate(year, e.target.value, day)
        }}
        style={{ flex: '2 1 100px', padding: '10px 8px' }}
      >
        <option value="">Bulan</option>
        {MONTHS.map((m, i) => (
          <option key={i+1} value={(i + 1).toString()}>{m}</option>
        ))}
      </select>
      
      <select 
        id={id}
        className="form-select" 
        value={year} 
        onChange={(e) => {
          setYear(e.target.value)
          handleUpdate(e.target.value, month, day)
        }}
        style={{ flex: '1 1 90px', padding: '10px 8px' }}
      >
        <option value="">Tahun</option>
        {years.map(y => (
          <option key={y} value={y.toString()}>{y}</option>
        ))}
      </select>
    </div>
  )
}
