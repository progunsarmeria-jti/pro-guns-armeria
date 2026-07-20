import React, { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Plus, Check } from 'lucide-react'

export default function CustomSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  allowCustom = true,
  customLabel = '+ Cadastrar Novo...',
  onAddCustom
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customInputValue, setCustomInputValue] = useState('')
  const containerRef = useRef(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowCustomInput(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lista filtrada em tempo real
  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectOption = (opt) => {
    onChange(opt)
    setIsOpen(false)
    setSearchTerm('')
    setShowCustomInput(false)
  }

  const handleConfirmCustom = () => {
    if (!customInputValue.trim()) return
    if (onAddCustom) {
      onAddCustom(customInputValue)
    } else {
      onChange(customInputValue.trim().toUpperCase())
    }
    setCustomInputValue('')
    setShowCustomInput(false)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
          {label}
        </label>
      )}

      {/* Botão de Disparo do Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          backgroundColor: '#161920',
          border: isOpen ? '1px solid var(--gold-accent)' : '1px solid var(--border-color)',
          color: value ? 'var(--text-main)' : 'var(--text-muted)',
          padding: '0.65rem 0.9rem',
          borderRadius: '6px',
          fontSize: '0.88rem',
          outline: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          fontWeight: value ? '700' : '400',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {/* Popover / Overlay do Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: '#121418',
          border: '1px solid var(--gold-accent)',
          borderRadius: '8px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.85)',
          zIndex: 99999,
          overflow: 'hidden'
        }}>
          {/* Input de Pesquisa Rápida */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#161920', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              autoFocus
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#FFF',
                fontSize: '0.82rem',
                outline: 'none',
                textTransform: 'uppercase'
              }}
            />
          </div>

          {/* Lista de Opções */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.25rem 0' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const isSelected = value === opt
                return (
                  <div
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    style={{
                      padding: '0.6rem 0.9rem',
                      fontSize: '0.84rem',
                      fontWeight: isSelected ? '700' : '400',
                      color: isSelected ? 'var(--gold-accent)' : 'var(--text-main)',
                      backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textTransform: 'uppercase',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 38, 42, 0.3)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(212, 175, 55, 0.12)' : 'transparent'}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check size={14} color="var(--gold-accent)" />}
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '0.75rem 0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Nenhum item encontrado
              </div>
            )}

            {/* Opção + Cadastrar Novo */}
            {allowCustom && !showCustomInput && (
              <div
                onClick={() => setShowCustomInput(true)}
                style={{
                  padding: '0.65rem 0.9rem',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  color: '#FBBF24',
                  borderTop: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)'}
              >
                <Plus size={14} />
                <span>{customLabel}</span>
              </div>
            )}

            {/* Campo de Cadastro Rápido de Novo Item */}
            {showCustomInput && (
              <div style={{ padding: '0.6rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#1A1D24', display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Novo item..."
                  value={customInputValue}
                  onChange={e => setCustomInputValue(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: '#161920',
                    border: '1px solid var(--border-color)',
                    color: '#FFF',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    outline: 'none',
                    textTransform: 'uppercase'
                  }}
                />
                <button
                  type="button"
                  className="btn-gold"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                  onClick={handleConfirmCustom}
                >
                  Adicionar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
