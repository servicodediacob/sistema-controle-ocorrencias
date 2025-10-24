// Caminho: frontend/src/components/SearchableSelect.tsx

import React, { useState, useEffect, useRef } from 'react';

interface Item {
  id: number;
  nome: string;
}

interface SearchableSelectProps {
  items: Item[];
  selectedId: number | '';
  onSelect: (id: number) => void;
  placeholder?: string;
  disabled?: boolean;
  highlightedIds?: Set<number>; // <-- Nova prop para os IDs a serem destacados
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  items,
  selectedId,
  onSelect,
  placeholder = 'Selecione um item',
  disabled = false,
  highlightedIds = new Set(), // <-- Valor padrão
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId) {
      const selectedItem = items.find(item => item.id === selectedId);
      setSearchTerm(selectedItem ? selectedItem.nome : '');
    } else {
      setSearchTerm('');
    }
  }, [selectedId, items]);

  // Normaliza strings removendo acentos para buscas mais tolerantes
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const filteredItems = items.filter(item =>
    normalize(item.nome).includes(normalize(searchTerm))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selectedItem = items.find(item => item.id === selectedId);
        setSearchTerm(selectedItem ? selectedItem.nome : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedId, items]);

  const handleSelect = (item: Item) => {
    onSelect(item.id);
    setSearchTerm(item.nome);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        data-cy="searchable-select-input"
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${selectedId ? 'highlight-input' : ''}`}
      />
      {isOpen && !disabled && (
        <ul data-cy="searchable-select-list" className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-600 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => {
              // Verifica se o ID do item atual está no conjunto de IDs destacados
              const isHighlighted = highlightedIds.has(item.id);
              return (
                <li data-cy="searchable-select-option"
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  // Aplica a classe de destaque condicionalmente
                  className={`relative cursor-pointer select-none py-2 pl-3 pr-9 text-white hover:bg-blue-600 ${isHighlighted ? 'font-bold text-teal-300' : ''}`}
                >
                  {item.nome}
                  {/* Adiciona um indicador visual (círculo verde) */}
                  {isHighlighted && <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-green-400"></span>}
                </li>
              );
            })
          ) : (
            <li className="px-3 py-2 text-gray-400">Nenhuma OBM encontrada.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
