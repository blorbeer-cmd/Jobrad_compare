import type { SortConfig, SortField } from '../../types/models';
import { Button } from '../base/Button';
import './SortBar.css';

interface SortBarProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  resultCount: number;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'monthlyRate', label: 'Monatliche Rate' },
  { field: 'price', label: 'Gesamtpreis' },
  { field: 'shopName', label: 'Shop-Name' },
];

export function SortBar({
  sortConfig,
  onSortChange,
  resultCount,
  viewMode,
  onViewModeChange,
}: SortBarProps) {
  function handleSortClick(field: SortField) {
    if (sortConfig.field === field) {
      onSortChange({
        field,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, direction: 'asc' });
    }
  }

  return (
    <div className="sort-bar">
      <span className="sort-bar__count">
        {resultCount} {resultCount === 1 ? 'Angebot' : 'Angebote'} gefunden
      </span>

      <div className="sort-bar__controls">
        <span className="sort-bar__label">Sortieren:</span>
        {SORT_OPTIONS.map((opt) => (
          <Button
            key={opt.field}
            variant={sortConfig.field === opt.field ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleSortClick(opt.field)}
          >
            {opt.label}
            {sortConfig.field === opt.field && (
              <span className="sort-bar__arrow">
                {sortConfig.direction === 'asc' ? ' \u2191' : ' \u2193'}
              </span>
            )}
          </Button>
        ))}

        <div className="sort-bar__separator" />

        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          aria-label="Kachelansicht"
        >
          &#9638;&#9638;
        </Button>
        <Button
          variant={viewMode === 'table' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('table')}
          aria-label="Tabellenansicht"
        >
          &#9776;
        </Button>
      </div>
    </div>
  );
}
