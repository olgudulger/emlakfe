'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import { 
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRoleProtection } from '@/hooks/use-role-protection';
import { saleService } from '@/services/sale-service';

const COLORS = [
  'hsl(215 25% 27%)', // Koyu gri-mavi
  'hsl(215 20% 65%)', // Orta gri  
  'hsl(215 28% 17%)', // Çok koyu gri
  'hsl(215 25% 45%)', // Orta koyu gri
  'hsl(215 30% 35%)'  // Koyu gri
];

const PropertyTypeLabels = {
  0: 'Arsa',
  1: 'Tarla', 
  2: 'Daire',
  3: 'İşyeri',
  4: 'Hisseli'
};

// String enum'ları sayılara çevir
const convertPropertyTypeStringToNumber = (typeString: string): number | null => {
  switch (typeString?.toLowerCase()) {
    case 'land': return 0;
    case 'field': return 1;
    case 'apartment': return 2;
    case 'commercial': return 3;
    case 'sharedparcel': return 4;
    default: return null;
  }
};

// Chart configurations
const monthlyChartConfig = {
  satisAdedi: {
    label: "Satış Adedi",
    color: "hsl(215 25% 27%)",
  },
  komisyon: {
    label: "Komisyon Toplamı",
    color: "hsl(215 20% 65%)",
  },
} satisfies ChartConfig;

const commissionChartConfig = {
  komisyon: {
    label: "Komisyon",
    color: "hsl(215 25% 27%)",
  },
  netKar: {
    label: "Net Kar",
    color: "hsl(215 20% 65%)",
  },
} satisfies ChartConfig;

const revenueChartConfig = {
  toplam: {
    label: "Toplam Satış TL",
    color: "hsl(215 20% 65%)",
  },
} satisfies ChartConfig;

const pieChartConfig = {
  arsa: {
    label: "Arsa",
    color: "hsl(var(--chart-1))",
  },
  tarla: {
    label: "Tarla", 
    color: "hsl(var(--chart-2))",
  },
  daire: {
    label: "Daire",
    color: "hsl(var(--chart-3))",
  },
  isyeri: {
    label: "İşyeri",
    color: "hsl(var(--chart-4))",
  },
  hisseli: {
    label: "Hisseli",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export default function ReportsPage() {
  const { hasPermission, isInitialized } = useRoleProtection();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Data queries
  const { data: allSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales-reports'],
    queryFn: () => saleService.getSales(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Filter completed sales only
  const completedSales = allSales.filter(sale => sale.status === 1);

  // Generate available years from sales data
  const availableYears = Array.from(
    new Set(
      completedSales.map(sale => new Date(sale.saleDate).getFullYear())
    )
  ).sort((a, b) => b - a);

  // Add current year if no sales yet
  const currentYear = new Date().getFullYear();
  if (!availableYears.includes(currentYear)) {
    availableYears.unshift(currentYear);
  }

  // Filter sales by selected year
  const yearSales = completedSales.filter(sale => {
    const saleYear = new Date(sale.saleDate).getFullYear();
    return saleYear === parseInt(selectedYear);
  });

  // Generate monthly data for selected year
  const year = parseInt(selectedYear);
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const monthlyData = months.map(month => {
    const monthSales = yearSales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate.getMonth() === month.getMonth();
    });

    const data = {
      month: format(month, 'MMM', { locale: tr }),
      monthFull: format(month, 'MMMM yyyy', { locale: tr }),
      satisAdedi: monthSales.length,
      toplam: monthSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0),
      komisyon: monthSales.reduce((sum, sale) => sum + (sale.commission || 0), 0),
      netKar: monthSales.reduce((sum, sale) => sum + (sale.netProfit || 0), 0),
    };
    
    if (monthSales.length > 0) {
      console.log(`${data.month}: ${data.satisAdedi} satış, ${data.komisyon} komisyon, ${data.netKar} net kar`);
    }
    
    return data;
  });

  console.log('Monthly data sample:', monthlyData.filter(d => d.satisAdedi > 0));

  // Property type analysis - string enum'ları sayılara çevir
  const propertyTypeData = Object.entries(PropertyTypeLabels).map(([type, label]) => {
    const typeNumber = parseInt(type);
    
    const typeSales = yearSales.filter(sale => {
      // sale.propertyType string enum olarak geliyor (örn: "Land")
      let salePropertyTypeNumber = null;
      
      if (sale.propertyType) {
        // String enum'u sayıya çevir
        salePropertyTypeNumber = convertPropertyTypeStringToNumber(sale.propertyType);
      }
      
      // Eğer sale.propertyType yok ama sale.property.propertyType varsa onu kullan
      if (!salePropertyTypeNumber && sale.property?.propertyType !== undefined) {
        salePropertyTypeNumber = sale.property.propertyType;
      }
      
      return salePropertyTypeNumber === typeNumber;
    });
    
    console.log(`Property type ${type} (${label}): ${typeSales.length} sales`);
    
    // Config key'leri ile eşle
    const configKey = label.toLowerCase().replace('ş', 's').replace('ı', 'i').replace('ğ', 'g').replace('ç', 'c').replace('ü', 'u').replace('ö', 'o');
    
    return {
      name: label,
      value: typeSales.length,
      total: typeSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0),
      fill: `hsl(var(--chart-${parseInt(type) + 1}))`,
      type: type,
    };
  }).filter(item => item.value > 0);

  console.log('Property type data:', propertyTypeData);
  console.log('Year sales sample:', yearSales.slice(0, 3).map(s => ({ 
    propertyType: s.propertyType, 
    propertyTypeType: typeof s.propertyType,
    salePrice: s.salePrice,
    property: s.property ? { propertyType: s.property.propertyType, propertyTypeType: typeof s.property.propertyType } : null
  })));
  
  // İlk satış objesinin tam yapısını göster
  if (yearSales.length > 0) {
    console.log('First sale object keys:', Object.keys(yearSales[0]));
    console.log('First sale full object:', yearSales[0]);
    console.log('First sale propertyType:', yearSales[0].propertyType);
    console.log('First sale propertyType type:', typeof yearSales[0].propertyType);
    console.log('Converted propertyType to number:', convertPropertyTypeStringToNumber(yearSales[0].propertyType || ''));
    console.log('First sale property object:', yearSales[0].property);
    if (yearSales[0].property) {
      console.log('First sale property.propertyType:', yearSales[0].property.propertyType);
      console.log('First sale property.propertyType type:', typeof yearSales[0].property.propertyType);
    }
  }

  // Year summary
  const yearSummary = {
    totalSales: yearSales.length,
    totalRevenue: yearSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0),
    totalCommission: yearSales.reduce((sum, sale) => sum + (sale.commission || 0), 0),
    totalNetProfit: yearSales.reduce((sum, sale) => sum + (sale.netProfit || 0), 0),
    averageSalePrice: yearSales.length > 0 ? yearSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0) / yearSales.length : 0,
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Satış Raporları</h1>
            <p className="text-muted-foreground">
              Detaylı satış analizleri ve trendler
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Yıl seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reports Content - PDF export için ID eklendi */}
        <div id="reports-content">
          {/* Year Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yearSummary.totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedYear} yılı
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Satış Tutarı</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{yearSummary.totalRevenue.toLocaleString('tr-TR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ortalama ₺{Math.round(yearSummary.averageSalePrice).toLocaleString('tr-TR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Komisyon</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{yearSummary.totalCommission.toLocaleString('tr-TR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Satışın %{yearSummary.totalRevenue > 0 ? ((yearSummary.totalCommission / yearSummary.totalRevenue) * 100).toFixed(1) : '0'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Kar</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{yearSummary.totalNetProfit.toLocaleString('tr-TR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Komisyondan kar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Aylık Satış Analizi
                </CardTitle>
                <CardDescription>
                  {selectedYear} yılı aylık satış adedi ve gelir
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <ChartContainer config={monthlyChartConfig}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="satisAdedi" fill="var(--color-satisAdedi)" radius={4} />
                      <Bar dataKey="komisyon" fill="var(--color-komisyon)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Property Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Emlak Tipi Dağılımı
                </CardTitle>
                <CardDescription>
                  {selectedYear} yılı emlak tipine göre satış dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : propertyTypeData.length > 0 ? (
                  <ChartContainer
                    config={pieChartConfig}
                    className="mx-auto aspect-square max-h-[300px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={propertyTypeData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        {propertyTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    {selectedYear} yılında satış verisi bulunamadı
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Commission Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Aylık Komisyon Trendi
                </CardTitle>
                <CardDescription>
                  {selectedYear} yılı aylık komisyon ve net kar analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <ChartContainer config={commissionChartConfig}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        dataKey="komisyon"
                        type="monotone"
                        stroke="hsl(215 25% 27%)"
                        strokeWidth={3}
                        connectNulls={true}
                        dot={{
                          fill: "hsl(215 25% 27%)",
                          r: 3,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                      <Line
                        dataKey="netKar"
                        type="monotone"
                        stroke="hsl(215 20% 65%)"
                        strokeWidth={3}
                        connectNulls={true}
                        dot={{
                          fill: "hsl(215 20% 65%)",
                          r: 3,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Aylık Satış TL Trendi
                </CardTitle>
                <CardDescription>
                  {selectedYear} yılı aylık toplam satış tutarı analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <ChartContainer config={revenueChartConfig}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        dataKey="toplam"
                        type="monotone"
                        stroke="hsl(215 20% 65%)"
                        strokeWidth={4}
                        connectNulls={true}
                        dot={{
                          fill: "hsl(215 20% 65%)",
                          r: 3,
                        }}
                        activeDot={{
                          r: 8,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 