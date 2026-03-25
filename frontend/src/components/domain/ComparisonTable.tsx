import type { Shop, ComparisonResult } from '../../types/models';
import './ComparisonTable.css';

interface ComparisonTableProps {
  comparison: ComparisonResult;
  shops: Shop[];
}

function getShop(shops: Shop[], shopId: string): Shop | undefined {
  return shops.find((s) => s.id === shopId);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function ComparisonTable({ comparison, shops }: ComparisonTableProps) {
  const { offers, cheapestOffer } = comparison;

  if (offers.length === 0) {
    return (
      <div className="comparison-table__empty">
        <p>Keine aktuellen Angebote gefunden.</p>
      </div>
    );
  }

  const sorted = [...offers].sort((a, b) => a.monthlyRate - b.monthlyRate);

  return (
    <div className="comparison-table__wrapper">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Shop</th>
            <th>Standort</th>
            <th>Monatliche Rate</th>
            <th>Gesamtpreis</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((offer) => {
            const shop = getShop(shops, offer.shopId);
            const isCheapest = cheapestOffer?.id === offer.id;

            return (
              <tr
                key={offer.id}
                className={isCheapest ? 'comparison-table__row--cheapest' : ''}
              >
                <td className="comparison-table__shop">
                  {shop?.name ?? offer.shopId}
                  {isCheapest && (
                    <span className="comparison-table__best-label">Bestes Angebot</span>
                  )}
                </td>
                <td>{shop?.location ?? '-'}</td>
                <td className="comparison-table__price">
                  {formatCurrency(offer.monthlyRate)}
                </td>
                <td>{formatCurrency(offer.price)}</td>
                <td>
                  <span
                    className={`comparison-table__status comparison-table__status--${
                      offer.isActive ? 'active' : 'inactive'
                    }`}
                  >
                    {offer.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
