// Color Picker with Shades for Vault
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Palette } from 'lucide-react'

// Base colors with their shade variations
export const COLOR_PALETTE = {
  red: {
    name: 'Red',
    shades: ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
    icon: '🔴'
  },
  orange: {
    name: 'Orange',
    shades: ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'],
    icon: '🟠'
  },
  amber: {
    name: 'Amber',
    shades: ['#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'],
    icon: '🟡'
  },
  yellow: {
    name: 'Yellow',
    shades: ['#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e'],
    icon: '💛'
  },
  lime: {
    name: 'Lime',
    shades: ['#d9f99d', '#bef264', '#a3e635', '#84cc16', '#65a30d', '#4d7c0f', '#3f6212'],
    icon: '💚'
  },
  green: {
    name: 'Green',
    shades: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'],
    icon: '🟢'
  },
  emerald: {
    name: 'Emerald',
    shades: ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46'],
    icon: '💎'
  },
  teal: {
    name: 'Teal',
    shades: ['#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59'],
    icon: '🩵'
  },
  cyan: {
    name: 'Cyan',
    shades: ['#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75'],
    icon: '🔵'
  },
  sky: {
    name: 'Sky',
    shades: ['#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985'],
    icon: '☁️'
  },
  blue: {
    name: 'Blue',
    shades: ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
    icon: '💙'
  },
  indigo: {
    name: 'Indigo',
    shades: ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'],
    icon: '🟣'
  },
  violet: {
    name: 'Violet',
    shades: ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
    icon: '💜'
  },
  purple: {
    name: 'Purple',
    shades: ['#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8'],
    icon: '🟪'
  },
  fuchsia: {
    name: 'Fuchsia',
    shades: ['#f5d0fe', '#f0abfc', '#e879f9', '#d946ef', '#c026d3', '#a21caf', '#86198f'],
    icon: '💗'
  },
  pink: {
    name: 'Pink',
    shades: ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d'],
    icon: '💖'
  },
  rose: {
    name: 'Rose',
    shades: ['#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239'],
    icon: '🌹'
  },
  slate: {
    name: 'Slate',
    shades: ['#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'],
    icon: '⬛'
  },
  gray: {
    name: 'Gray',
    shades: ['#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'],
    icon: '◽'
  }
}

// Get shade variants for a given base color
export const getColorShades = (colorKey) => {
  return COLOR_PALETTE[colorKey]?.shades || COLOR_PALETTE.blue.shades
}

// Get contrasting text color for a background
export const getContrastColor = (hexColor) => {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

// Generate auto-assigned colors for children based on parent
export const generateChildColors = (parentColor, count) => {
  const colorKeys = Object.keys(COLOR_PALETTE)
  const parentIndex = colorKeys.findIndex(k => 
    COLOR_PALETTE[k].shades.includes(parentColor)
  )
  
  if (parentIndex === -1) return Array(count).fill(parentColor)
  
  const parentKey = colorKeys[parentIndex]
  const shades = COLOR_PALETTE[parentKey].shades
  const parentShadeIndex = shades.indexOf(parentColor)
  
  // Generate adjacent shades for children
  const colors = []
  for (let i = 0; i < count; i++) {
    const shadeIndex = Math.min(Math.max(parentShadeIndex + (i % 3) - 1, 0), shades.length - 1)
    colors.push(shades[shadeIndex])
  }
  return colors
}

// Color Picker Component
const ColorPicker = ({ 
  value, 
  onChange, 
  label = 'Color',
  showShades = true,
  compact = false 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedBase, setSelectedBase] = useState(() => {
    // Find which base color the value belongs to
    for (const [key, palette] of Object.entries(COLOR_PALETTE)) {
      if (palette.shades.includes(value)) return key
    }
    return 'blue'
  })
  const containerRef = useRef(null)
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleColorSelect = (color) => {
    onChange(color)
    if (!showShades) setIsOpen(false)
  }

  const handleBaseSelect = (baseKey) => {
    setSelectedBase(baseKey)
    // Auto-select middle shade
    const middleShade = COLOR_PALETTE[baseKey].shades[3]
    onChange(middleShade)
  }

  if (compact) {
    return (
      <div className="relative inline-block" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-lg border-2 border-[var(--border-color)] hover:border-[var(--accent)] transition-colors flex items-center justify-center"
          style={{ background: value || '#6b7280' }}
        >
          {!value && <Palette className="w-4 h-4 text-white" />}
        </button>
        
        {isOpen && (
          <div className="absolute left-0 top-10 z-[9999] p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl">
            <div className="grid grid-cols-6 gap-1.5 min-w-max">
              {Object.entries(COLOR_PALETTE).map(([key, palette]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { handleColorSelect(palette.shades[3]); setIsOpen(false) }}
                  className="w-6 h-6 rounded-md hover:scale-110 transition-transform relative"
                  style={{ background: palette.shades[3] }}
                  title={palette.name}
                >
                  {value === palette.shades[3] && (
                    <Check className="w-3 h-3 absolute inset-0 m-auto" style={{ color: getContrastColor(palette.shades[3]) }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      )}
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors flex items-center gap-3"
        >
          <div
            className="w-8 h-8 rounded-lg border border-white/20"
            style={{ background: value || '#6b7280' }}
          />
          <span className="flex-1 text-left text-sm text-[var(--text-primary)]">
            {value ? `Selected: ${value}` : 'Choose a color'}
          </span>
          <Palette className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 top-full mt-2 left-0 right-0 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl"
            >
              {/* Base Color Selection */}
              <div className="mb-4">
                <div className="text-xs text-[var(--text-tertiary)] mb-2">Base Color</div>
                <div className="grid grid-cols-10 gap-1.5">
                  {Object.entries(COLOR_PALETTE).slice(0, 10).map(([key, palette]) => (
                    <button
                      key={key}
                      onClick={() => handleBaseSelect(key)}
                      className={`w-7 h-7 rounded-lg hover:scale-110 transition-transform relative ${
                        selectedBase === key ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-secondary)]' : ''
                      }`}
                      style={{ background: palette.shades[3] }}
                      title={palette.name}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-10 gap-1.5 mt-1.5">
                  {Object.entries(COLOR_PALETTE).slice(10).map(([key, palette]) => (
                    <button
                      key={key}
                      onClick={() => handleBaseSelect(key)}
                      className={`w-7 h-7 rounded-lg hover:scale-110 transition-transform relative ${
                        selectedBase === key ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-secondary)]' : ''
                      }`}
                      style={{ background: palette.shades[3] }}
                      title={palette.name}
                    />
                  ))}
                </div>
              </div>
              
              {/* Shade Selection */}
              {showShades && (
                <div>
                  <div className="text-xs text-[var(--text-tertiary)] mb-2">
                    {COLOR_PALETTE[selectedBase].name} Shades
                  </div>
                  <div className="flex gap-1.5">
                    {COLOR_PALETTE[selectedBase].shades.map((shade, idx) => (
                      <button
                        key={shade}
                        onClick={() => handleColorSelect(shade)}
                        className={`flex-1 h-10 rounded-lg hover:scale-105 transition-transform relative ${
                          value === shade ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-secondary)]' : ''
                        }`}
                        style={{ background: shade }}
                        title={`Shade ${idx + 1}`}
                      >
                        {value === shade && (
                          <Check 
                            className="w-4 h-4 absolute inset-0 m-auto" 
                            style={{ color: getContrastColor(shade) }} 
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full mt-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ColorPicker

