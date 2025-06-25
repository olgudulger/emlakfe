'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  Users,
  DollarSign,
  TrendingUp,
  Home,
  MapPin,
  Calendar,
  Activity,
  User,
  Search,
  Heart,
  Eye
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRoleProtection } from '@/hooks/use-role-protection';
import { PropertyService } from '@/services/property-service';
import { customerService } from '@/services/customer-service';
import { saleService } from '@/services/sale-service';
import { PropertyStatus } from '@/types/property';

const propertyService = new PropertyService();

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon,
  isLoading = false
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  isLoading?: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </>
      )}
    </CardContent>
  </Card>
);

const getStatusBadge = (status: PropertyStatus | string) => {
  const statusStr = typeof status === 'number' ? 
    (status === 0 ? 'Satılık' : status === 1 ? 'Kiralık' : 'SatılıkKiralık') :
    status;
    
  switch (statusStr) {
    case 'Available':
    case 'Satılık':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Satılık</Badge>;
    case 'Reserved':
    case 'Rezerve':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Rezerve</Badge>;
    case 'Sold':
    case 'Satıldı':
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Satıldı</Badge>;
    case 'Kiralık':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Kiralık</Badge>;
    case 'SatılıkKiralık':
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Satılık/Kiralık</Badge>;
    default:
      return <Badge variant="secondary">{statusStr}</Badge>;
  }
};

const getPropertyTypeName = (type: number) => {
  switch (type) {
    case 0: return 'Arsa';
    case 1: return 'Tarla';
    case 2: return 'Daire';
    case 3: return 'İşyeri';
    case 4: return 'Hisseli';
    default: return 'Bilinmiyor';
  }
};

export default function UserDashboardPage() {
  const { hasPermission, isInitialized, user } = useRoleProtection({ requiredRole: 'user' });
  const router = useRouter();

  // Real data queries
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties-user'],
    queryFn: () => propertyService.getProperties(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-user'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: allSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales-user'],
    queryFn: () => saleService.getSales(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate stats from real data
  const totalProperties = properties.length;
  const totalCustomers = customers.length;
  const availableProperties = properties.filter(p => 
    p.status === 'Satılık' || p.status === 'SatılıkKiralık'
  ).length;
  
  // Sales statistics - only completed sales (status = 1)
  const completedSales = allSales.filter(sale => sale.status === 1);
  const totalSales = completedSales.length;
  
  // Monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthProperties = properties.filter(p => {
    const createdAt = new Date(p.createdAt);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;

  // Recent properties (last 3)
  const recentProperties = properties
    .filter(p => p.status === 'Satılık' || p.status === 'SatılıkKiralık')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(property => ({
      id: property.id.toString(),
      title: property.title,
      price: property.typeSpecificProperties?.TotalPrice || 0,
      type: property.propertyType,
      status: property.status,
      createdAt: property.createdAt
    }));

  if (!isInitialized) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Yükleniyor...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPermission) {
    return null;
  }

  const getUserDisplayName = () => {
    if (!user) return 'Kullanıcı';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.firstName) {
      return user.firstName;
    }
    
    return user.username || 'Kullanıcı';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hoş geldiniz, {getUserDisplayName()}!
            </h1>
            <p className="text-muted-foreground">
              Emlak takip sistemi - Portföy durumu
            </p>
          </div>
        </div>

        {/* User Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Toplam Emlak"
            value={totalProperties}
            description={`Bu ay +${thisMonthProperties} yeni eklendi`}
            icon={Building2}
            isLoading={propertiesLoading}
          />
          <StatCard
            title="Satılık Emlak"
            value={availableProperties}
            description="Satışa hazır emlaklar"
            icon={Home}
            isLoading={propertiesLoading}
          />
          <StatCard
            title="Toplam Müşteri"
            value={totalCustomers}
            description="Kayıtlı müşteri sayısı"
            icon={Users}
            isLoading={customersLoading}
          />
          <StatCard
            title="Toplam Satış"
            value={totalSales}
            description="Tamamlanmış satışlar"
            icon={DollarSign}
            isLoading={salesLoading}
          />
        </div>

        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Son Eklenen Emlaklar
            </CardTitle>
            <CardDescription>
              Satışa hazır son emlak ilanları
            </CardDescription>
          </CardHeader>
          <CardContent>
            {propertiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {property.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {property.price > 0 ? `₺${property.price.toLocaleString('tr-TR')}` : 'Fiyat belirlenmemiş'} • {getPropertyTypeName(property.type)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(property.status)}
                    </div>
                  </div>
                ))}
                {recentProperties.length === 0 && (
                  <p className="text-sm text-muted-foreground">Henüz satılık emlak eklenmemiş</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Hızlı İşlemler
            </CardTitle>
            <CardDescription>
              Sık kullanılan emlak işlemleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/properties')}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">Emlak İşlemleri</p>
                    <p className="text-sm text-muted-foreground">Emlakları yönetin</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/customers')}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Müşteriler</p>
                    <p className="text-sm text-muted-foreground">Müşteri işlemleri</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/locations')}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <MapPin className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-medium">Lokasyonlar</p>
                    <p className="text-sm text-muted-foreground">Konum işlemleri</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/user-dashboard')}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="font-medium">Dashboard</p>
                    <p className="text-sm text-muted-foreground">Ana sayfa</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 