// Caminho: frontend/src/components/SearchableSelect.tsx

import React, { useState, useEffect, useRef } from 'react';

// Interface para os itens que o componente pode receber
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
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  items,
  selectedId,
  onSelect,
  placeholder = 'Selecione um item',
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Encontra o nome do item selecionado para exibir no input
  useEffect(() => {
    if (selectedId) {
      const selectedItem = items.find(item => item.id === selectedId);
      setSearchTerm(selectedItem ? selectedItem.nome : '');
    } else {
      setSearchTerm('');
    }
  }, [selectedId, items]);

  // Filtra os itens com base no termo de busca
  const filteredItems = items.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fecha o dropdown se o usuário clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Se o dropdown for fechado sem uma seleção válida, reverte para o nome do item selecionado
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
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {isOpen && !disabled && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-600 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <li
                key={item.id}
                onClick={() => handleSelect(item)}
                className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-white hover:bg-blue-600"
              >
                {item.nome}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-400">Nenhuma OBM encontrada.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
