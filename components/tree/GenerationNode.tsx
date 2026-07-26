import { memo } from 'react'

function GenerationNode({ data }: any) {
  return (
    <div 
      style={{
        width: `${data.width}px`,
        borderTop: '2px dashed var(--color-border)',
        position: 'relative',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: '-14px',
          left: '400px', // aligned with the left padding we added
          background: 'var(--color-bg)',
          padding: '4px 12px',
          borderRadius: '16px',
          color: 'var(--color-primary-light)',
          fontFamily: 'var(--font-family-serif)',
          fontSize: '13px',
          fontWeight: 700,
          border: '1px solid var(--color-accent-light)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        Generasi {data.generation}
      </div>
    </div>
  )
}

export default memo(GenerationNode)
