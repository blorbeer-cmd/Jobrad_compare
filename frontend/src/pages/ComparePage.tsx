import { useState, useMemo } from 'react';
import type { ComparisonResult, SortConfig, Offer } from '../types/models';
import { PageLayout } from '../components/layout';
import { BikeSelector, ComparisonGrid, ComparisonTable, SortBar } from '../components/domain';
import { MOCK_SHOPS, MOCK_OFFERS, BRANDS, MODELS_BY_BRAND } from '../data/mockData';
import './ComparePage.css';

export function ComparePage() {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'monthlyRate',
    direction: 'asc',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const models = selectedBrand ? MODELS_BY_BRAND[selectedBrand] ?? [] : [];

  function handleBrandChange(brand: string) {
    setSelectedBrand(brand);
    setSelectedModel('');
    setComparison(null);
  }

  function handleCompare() {
    if (!selectedBrand || !selectedModel) return;

    const matchingOffers = MOCK_OFFERS.filter(
      (o) => o.bikeBrand === selectedBrand && o.bikeModel === selectedModel && o.isActive,
    );

    const cheapest =
      matchingOffers.length > 0
        ? matchingOffers.reduce((min, o) => (o.monthlyRate < min.monthlyRate ? o : min))
        : null;

    setComparison({
      bikeModel: selectedModel,
      bikeBrand: selectedBrand,
      offers: matchingOffers,
      cheapestOffer: cheapest,
    });
  }

  const sortedComparison = useMemo(() => {
    if (!comparison) return null;

    const sorted = [...comparison.offers].sort((a, b) => {
      let cmp = 0;
      switch (sortConfig.field) {
        case 'monthlyRate':
          cmp = a.monthlyRate - b.monthlyRate;
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'shopName': {
          const nameA = MOCK_SHOPS.find((s) => s.id === a.shopId)?.name ?? '';
          const nameB = MOCK_SHOPS.find((s) => s.id === b.shopId)?.name ?? '';
          cmp = nameA.localeCompare(nameB);
          break;
        }
      }
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    return { ...comparison, offers: sorted };
  }, [comparison, sortConfig]);

  function handleSelectOffer(offer: Offer) {
    alert(`Angebot "${offer.id}" von Shop "${offer.shopId}" ausgewaehlt.`);
  }

  return (
    <PageLayout>
      <div className="compare-page">
        <div className="compare-page__hero">
          <h1 className="compare-page__title">JobRad Angebote vergleichen</h1>
          <p className="compare-page__subtitle">
            Finde das beste Dienstrad-Angebot aus verschiedenen Shops in deiner Naehe.
          </p>
        </div>

        <BikeSelector
          brands={BRANDS}
          models={models}
          selectedBrand={selectedBrand}
          selectedModel={selectedModel}
          onBrandChange={handleBrandChange}
          onModelChange={setSelectedModel}
          onCompare={handleCompare}
        />

        {sortedComparison && (
          <section className="compare-page__results">
            <h2 className="compare-page__results-title">
              {sortedComparison.bikeBrand} {sortedComparison.bikeModel}
            </h2>

            <SortBar
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              resultCount={sortedComparison.offers.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {viewMode === 'grid' ? (
              <ComparisonGrid
                comparison={sortedComparison}
                shops={MOCK_SHOPS}
                onSelectOffer={handleSelectOffer}
              />
            ) : (
              <ComparisonTable comparison={sortedComparison} shops={MOCK_SHOPS} />
            )}
          </section>
        )}
      </div>
    </PageLayout>
  );
}
