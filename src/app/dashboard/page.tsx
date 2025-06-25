'use client';

import { useEffect } from 'react';
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
  Shield
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useRoleProtection } from '@/hooks/use-role-protection';
import { PropertyService } from '@/services/property-service';
import { customerService } from '@/services/customer-service';
import { userService } from '@/services/user-service';
import { saleService } from '@/services/sale-service';
import { PropertyStatus } from '@/types/property';

const propertyService = new PropertyService();

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  isLoading = false
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: string;
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
            {trend && (
              <span className="text-green-600 ml-1">
                {trend}
              </span>
            )}
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

const getCustomerTypeBadge = (type: string) => {
  switch (type) {
    case 'Buyer':
    case 'Alıcı':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Alıcı</Badge>;
    case 'Seller':
    case 'Satıcı':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Satıcı</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
};

export default function AdminDashboardPage() {
  const { hasPermission, isInitialized, user } = useRoleProtection({ requiredRole: 'admin' });
  const router = useRouter();

  // Real data queries
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties-admin'],
    queryFn: () => propertyService.getProperties(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-admin'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-admin'],
    queryFn: () => userService.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: allSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales-dashboard'],
    queryFn: () => saleService.getSales(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate stats from real data
  const totalProperties = properties.length;
  const totalCustomers = customers.length;
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive !== false).length;

  // Sales statistics - all completed transactions (status = 1) including both sales and rentals
  const completedTransactions = allSales.filter(sale => sale.status === 1);
  const totalTransactions = completedTransactions.length;
  
  // Monthly transactions and income calculation
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthTransactions = completedTransactions.filter(sale => {
    const saleDate = new Date(sale.saleDate);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });
  
  const thisMonthIncome = thisMonthTransactions.reduce((sum, sale) => sum + (sale.netProfit || 0), 0);

  // Geçen ayın gelirini hesapla
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const lastMonthTransactions = completedTransactions.filter(sale => {
    const saleDate = new Date(sale.saleDate);
    return saleDate.getMonth() === lastMonth && saleDate.getFullYear() === lastMonthYear;
  });
  
  const lastMonthIncome = lastMonthTransactions.reduce((sum, sale) => sum + (sale.netProfit || 0), 0);
  
  // Aylık gelir değişimi hesapla
  const incomeChange = thisMonthIncome - lastMonthIncome;
  const incomeChangeText = incomeChange >= 0 ? `+₺${incomeChange.toLocaleString('tr-TR')}` : `-₺${Math.abs(incomeChange).toLocaleString('tr-TR')}`;

  const thisMonthProperties = properties.filter(p => {
    const createdAt = new Date(p.createdAt);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;

  const thisMonthCustomers = customers.filter(c => {
    const createdAt = new Date(c.createdAt);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;

  // Recent properties (last 5)
  const recentProperties = properties
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

  // Recent customers (last 5)
  const recentCustomers = customers
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2)
    .map(customer => ({
      id: customer.id.toString(),
      name: customer.fullName,
      phone: customer.phone,
      type: customer.customerType === 0 ? 'Alıcı' : customer.customerType === 1 ? 'Satıcı' : 'Alıcı/Satıcı',
      createdAt: customer.createdAt
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
    if (!user) return 'Yönetici';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.firstName) {
      return user.firstName;
    }
    
    return user.username || 'Yönetici';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hoş geldiniz, {getUserDisplayName()}!
            </h1>
            <p className="text-muted-foreground">
              Sistem yönetim paneli - Emlak portföyünün genel durumu
            </p>
          </div>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Toplam Emlak"
            value={totalProperties}
            description={`Bu ay +${thisMonthProperties} yeni`}
            icon={Building2}
            trend={thisMonthProperties > 0 ? `+${thisMonthProperties}` : ""}
            isLoading={propertiesLoading}
          />
          <StatCard
            title="Toplam Müşteri"
            value={totalCustomers}
            description={`Bu ay +${thisMonthCustomers} yeni`}
            icon={Users}
            trend={thisMonthCustomers > 0 ? `+${thisMonthCustomers}` : ""}
            isLoading={customersLoading}
          />
          <StatCard
            title="Toplam İşlem"
            value={totalTransactions}
            description={`Tamamlanmış satış ve kiralama`}
            icon={DollarSign}
            isLoading={salesLoading}
          />
          <StatCard
            title="Aylık Gelir"
            value={`₺${thisMonthIncome.toLocaleString('tr-TR')}`}
            description={`Elde ettiğimiz aylık net gelir`}
            icon={TrendingUp}
            trend={incomeChangeText}
            isLoading={salesLoading}
          />
        </div>

        {/* System Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Toplam Kullanıcı"
            value={totalUsers}
            description="Kayıtlı kullanıcı sayısı"
            icon={Users}
            isLoading={usersLoading}
          />
          <StatCard
            title="Aktif Kullanıcı"
            value={activeUsers}
            description="Son 30 günde aktif"
            icon={Activity}
            isLoading={usersLoading}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Son Eklenen Emlaklar
              </CardTitle>
              <CardDescription>
                Son eklenen emlak ilanları
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
                          {property.price > 0 ? `₺${property.price.toLocaleString('tr-TR')}` : 'Fiyat belirlenmemiş'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(property.status)}
                      </div>
                    </div>
                  ))}
                  {recentProperties.length === 0 && (
                    <p className="text-sm text-muted-foreground">Henüz emlak eklenmemiş</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Son Eklenen Müşteriler
              </CardTitle>
              <CardDescription>
                Son kayıt olan müşteriler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customer.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCustomerTypeBadge(customer.type)}
                      </div>
                    </div>
                  ))}
                  {recentCustomers.length === 0 && (
                    <p className="text-sm text-muted-foreground">Henüz müşteri eklenmemiş</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Yönetici İşlemleri
            </CardTitle>
            <CardDescription>
              Sistem yönetimi ve hızlı işlemler
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
                    <p className="font-medium">Emlak Yönetimi</p>
                    <p className="text-sm text-muted-foreground">Tüm emlakları yönetin</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/sales')}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Alım/Satım/Kiralama</p>
                    <p className="text-sm text-muted-foreground">Satış işlemlerini yönetin</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/user-management')}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-medium">Kullanıcı Yönetimi</p>
                    <p className="text-sm text-muted-foreground">Kullanıcıları yönetin</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/customers')}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Users className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="font-medium">Müşteri Yönetimi</p>
                    <p className="text-sm text-muted-foreground">Müşterileri yönetin</p>
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