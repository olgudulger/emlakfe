'use client';

import { useQuery } from '@tanstack/react-query';
import { propertyService } from '@/services/property-service';
import { PriceHistoryEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, History } from 'lucide-react';

interface PropertyPriceHistoryProps {
  propertyId: number;
}

export function PropertyPriceHistory({ propertyId }: PropertyPriceHistoryProps) {
  const { data: priceHistory = [], isLoading, error } = useQuery({
    queryKey: ['property-price-history', propertyId],
    queryFn: () => propertyService.getPriceHistory(propertyId),
    enabled: !!propertyId,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale so it refetches when invalidated
  });

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price)) {
      return '₺0';
    }
    return `₺${price.toLocaleString('tr-TR')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriceChangeIcon = (previousPrice: number | null, currentPrice: number | null | undefined) => {
    if (previousPrice === null || currentPrice === null || currentPrice === undefined) return <Minus className="h-4 w-4" />;
    if (currentPrice > previousPrice) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (currentPrice < previousPrice) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4" />;
  };

  const getPriceChangeBadge = (previousPrice: number | null, currentPrice: number | null | undefined) => {
    if (previousPrice === null || currentPrice === null || currentPrice === undefined) {
      return <Badge variant="secondary">İlk Fiyat</Badge>;
    }
    
    const difference = currentPrice - previousPrice;
    const percentageChange = ((difference / previousPrice) * 100).toFixed(1);
    
    if (difference > 0) {
      return (
        <Badge variant="outline" className="bg-green-600 text-white border-green-600 hover:bg-green-700">
          +{formatPrice(difference)} (+%{percentageChange})
        </Badge>
      );
    } else if (difference < 0) {
      return (
        <Badge variant="destructive">
          {formatPrice(difference)} ({percentageChange}%)
        </Badge>
      );
    } else {
      return <Badge variant="secondary">Değişmedi</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Fiyat Geçmişi
          </CardTitle>
          <CardDescription>Emlak fiyat değişikliklerini görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Fiyat geçmişi yükleniyor...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Fiyat Geçmişi
          </CardTitle>
          <CardDescription>Emlak fiyat değişikliklerini görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Fiyat geçmişi yüklenirken hata oluştu.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Fiyat Geçmişi
          </CardTitle>
          <CardDescription>Emlak fiyat değişikliklerini görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Henüz fiyat değişikliği kaydı bulunmuyor.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Fiyat Geçmişi
        </CardTitle>
        <CardDescription>
          Toplam {priceHistory.length} fiyat değişikliği kaydı
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {priceHistory.map((entry, index) => {
            // Önceki fiyatı array'den hesapla (bir sonraki entry'nin fiyatı)
            const previousPrice = index < priceHistory.length - 1 ? priceHistory[index + 1].price : null;
            
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                    {getPriceChangeIcon(previousPrice, entry.price)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatPrice(entry.price)}
                      </span>
                      {getPriceChangeBadge(previousPrice, entry.price)}
                    </div>
                    {previousPrice && (
                      <div className="text-sm text-muted-foreground">
                        Önceki fiyat: {formatPrice(previousPrice)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">
                    {formatDate(entry.date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 