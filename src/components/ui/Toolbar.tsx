import {
  CaretDown,
  MagnifyingGlass,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

type ToolbarProps = {
  query: string;
  setQuery: (query: string) => void;
  placeholder: string;
  action?: ReactNode;
  filters?: boolean;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: string[];
};

export function Toolbar({
  query,
  setQuery,
  placeholder,
  action,
  filters = true,
  filterValue,
  onFilterChange,
  filterOptions = ["Activa", "Borrador", "Inactiva"],
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <label className="search">
        <MagnifyingGlass size={18} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>
      {filters && onFilterChange ? (
        <label className="filter-control">
          <SlidersHorizontal size={16} />
          <select
            value={filterValue ?? ""}
            onChange={(event) => onFilterChange(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {filterOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
          <CaretDown size={14} />
        </label>
      ) : (
        filters && (
          <button className="filter-button">
            <SlidersHorizontal size={16} /> Filtros <CaretDown size={14} />
          </button>
        )
      )}
      {action}
    </div>
  );
}
