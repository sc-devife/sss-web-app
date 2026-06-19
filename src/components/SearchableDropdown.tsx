import React, { useEffect, useRef, useState } from "react";
import * as S from "./styles/searchableDropdownStyle";

export interface DropdownOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
}: SearchableDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <S.Container ref={dropdownRef}>
      <S.Input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        value={isOpen ? search : (selectedOption?.label ?? "")}
        onFocus={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        onChange={(e) => {
          if (!disabled) {
            setSearch(e.target.value);
            setIsOpen(true);
          }
        }}
      />

      {!disabled && isOpen && (
        <S.Dropdown>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <S.Option
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setSearch("");
                  setIsOpen(false);
                }}
              >
                {option.label}
              </S.Option>
            ))
          ) : (
            <S.NoResults>No results found</S.NoResults>
          )}
        </S.Dropdown>
      )}
    </S.Container>
  );
};

export default SearchableDropdown;
