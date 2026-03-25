import './PriceDisplay.css';

interface PriceDisplayProps {
  monthlyRate: number;
  totalPrice: number;
  isCheapest?: boolean;
  className?: string;
}

export function PriceDisplay({
  monthlyRate,
  totalPrice,
  isCheapest = false,
  className = '',
}: PriceDisplayProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);

  return (
    <div className={`price-display ${isCheapest ? 'price-display--cheapest' : ''} ${className}`}>
      <div className="price-display__monthly">
        <span className="price-display__label">Monatliche Rate</span>
        <span className="price-display__value">{formatCurrency(monthlyRate)}</span>
      </div>
      <div className="price-display__total">
        <span className="price-display__label">Gesamtpreis</span>
        <span className="price-display__total-value">{formatCurrency(totalPrice)}</span>
      </div>
      {isCheapest && (
        <span className="price-display__cheapest-tag">Bestes Angebot</span>
      )}
    </div>
  );
}
