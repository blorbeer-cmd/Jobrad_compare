import type { Offer, Shop } from '../../types/models';
import { Card, CardHeader, CardBody, CardFooter } from '../base/Card';
import { Badge } from '../base/Badge';
import { Button } from '../base/Button';
import { PriceDisplay } from './PriceDisplay';
import './OfferCard.css';

interface OfferCardProps {
  offer: Offer;
  shop: Shop;
  isCheapest?: boolean;
  onSelect?: (offer: Offer) => void;
}

export function OfferCard({ offer, shop, isCheapest = false, onSelect }: OfferCardProps) {
  return (
    <Card variant={isCheapest ? 'cheapest' : 'default'} className="offer-card">
      <CardHeader>
        <div className="offer-card__header-content">
          <div>
            <h3 className="offer-card__shop-name">{shop.name}</h3>
            {shop.location && (
              <span className="offer-card__location">{shop.location}</span>
            )}
          </div>
          <Badge variant={offer.isActive ? 'success' : 'error'}>
            {offer.isActive ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </div>
      </CardHeader>

      <CardBody>
        <div className="offer-card__bike-info">
          <span className="offer-card__bike-brand">{offer.bikeBrand}</span>
          <span className="offer-card__bike-model">{offer.bikeModel}</span>
        </div>
        <PriceDisplay
          monthlyRate={offer.monthlyRate}
          totalPrice={offer.price}
          isCheapest={isCheapest}
        />
      </CardBody>

      <CardFooter>
        <Button
          variant={isCheapest ? 'primary' : 'outline'}
          fullWidth
          onClick={() => onSelect?.(offer)}
        >
          Angebot ansehen
        </Button>
      </CardFooter>
    </Card>
  );
}
