import { type ChangeEvent } from 'react';
import { Select } from '../base/Select';
import { Button } from '../base/Button';
import './BikeSelector.css';

interface BikeSelectorProps {
  brands: string[];
  models: string[];
  selectedBrand: string;
  selectedModel: string;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  onCompare: () => void;
  isLoading?: boolean;
}

export function BikeSelector({
  brands,
  models,
  selectedBrand,
  selectedModel,
  onBrandChange,
  onModelChange,
  onCompare,
  isLoading = false,
}: BikeSelectorProps) {
  return (
    <div className="bike-selector">
      <h2 className="bike-selector__title">Fahrrad auswaehlen</h2>
      <div className="bike-selector__fields">
        <Select
          label="Marke"
          options={brands.map((b) => ({ value: b, label: b }))}
          placeholder="Marke waehlen..."
          value={selectedBrand}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onBrandChange(e.target.value)}
          fullWidth
        />
        <Select
          label="Modell"
          options={models.map((m) => ({ value: m, label: m }))}
          placeholder="Modell waehlen..."
          value={selectedModel}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onModelChange(e.target.value)}
          disabled={!selectedBrand}
          fullWidth
        />
        <Button
          variant="primary"
          size="lg"
          onClick={onCompare}
          disabled={!selectedBrand || !selectedModel || isLoading}
          className="bike-selector__btn"
        >
          {isLoading ? 'Laden...' : 'Angebote vergleichen'}
        </Button>
      </div>
    </div>
  );
}
