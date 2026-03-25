import type { Offer, Shop, ComparisonResult } from '../../types/models';
import { OfferCard } from './OfferCard';
import './ComparisonGrid.css';

interface ComparisonGridProps {
  comparison: ComparisonResult;
  shops: Shop[];
  onSelectOffer?: (offer: Offer) => void;
}

function getShop(shops: Shop[], shopId: string): Shop {
  return shops.find((s) => s.id === shopId) ?? { id: shopId, name: shopId, location: '' };
}

export function ComparisonGrid({ comparison, shops, onSelectOffer }: ComparisonGridProps) {
  const { offers, cheapestOffer } = comparison;

  if (offers.length === 0) {
    return (
      <div className="comparison-grid__empty">
        <div className="comparison-grid__empty-icon">&#128269;</div>
        <h3>Keine Angebote gefunden</h3>
        <p>Fuer diese Auswahl liegen derzeit keine aktuellen Angebote vor.</p>
      </div>
    );
  }

  const sorted = [...offers].sort((a, b) => a.monthlyRate - b.monthlyRate);

  return (
    <div className="comparison-grid">
      {sorted.map((offer) => (
        <OfferCard
          key={offer.id}
          offer={offer}
          shop={getShop(shops, offer.shopId)}
          isCheapest={cheapestOffer?.id === offer.id}
          onSelect={onSelectOffer}
        />
      ))}
    </div>
  );
}
