import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Property, Customer } from '@/types';

// PDF Export funkciyonu - geliştirilmiş versiyon
export const exportToPDF = async (elementId: string, filename: string = 'rapor') => {
  try {
    console.log('PDF export başlıyor, element ID:', elementId);
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element bulunamadı:', elementId);
      alert(`Element bulunamadı: ${elementId}`);
      return;
    }

    console.log('Element bulundu, canvas oluşturuluyor...');

    // Chart'ları SVG'den Canvas'a dönüştürmek için ek ayarlar
    const canvasOptions = {
      scale: 1.5, // Scale'i biraz düşürdük
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false, // Logging'i kapatıyoruz
      height: element.scrollHeight,
      width: element.scrollWidth,
      onclone: (clonedDoc: Document) => {
        // SVG'leri raster görüntüye dönüştürmek için
        const svgElements = clonedDoc.querySelectorAll('svg');
        svgElements.forEach((svg) => {
          svg.setAttribute('width', svg.getAttribute('width') || '400');
          svg.setAttribute('height', svg.getAttribute('height') || '300');
        });
      }
    };

    // HTML'i canvas'a çevir
    const canvas = await html2canvas(element, canvasOptions);

    console.log('Canvas oluşturuldu, PDF oluşturuluyor...', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });

    const imgData = canvas.toDataURL('image/png', 0.95); // Kaliteyi %95 yaptık
    
    // PDF oluştur
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Sayfa boyutlarını hesapla
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin her yandan
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 10; // 10mm top margin
    
    console.log('PDF boyutları hesaplandı:', { 
      pdfWidth, 
      pdfHeight, 
      imgWidth, 
      imgHeight,
      totalPages: Math.ceil(imgHeight / (pdfHeight - 20))
    });

    // İlk sayfa
    if (heightLeft <= pdfHeight - 20) {
      // Tek sayfaya sığıyor
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    } else {
      // Çoklu sayfa gerekli
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Ek sayfalar
      while (heightLeft >= 0) {
        position = -(imgHeight - heightLeft) + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
    }

    console.log('PDF oluşturuldu, indiriliyor...');

    // PDF'i indir
    pdf.save(`${filename}.pdf`);
    console.log('PDF başarıyla indirildi');
    
    // Başarı mesajı
    alert('PDF başarıyla indirildi!');
    
  } catch (error) {
    console.error('PDF export hatası:', error);
    console.error('Hata detayları:', {
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: error instanceof Error ? error.stack : 'Stack yok',
      elementId,
      filename
    });
    
    // Daha detaylı hata mesajı
    let errorMessage = 'PDF export sırasında bir hata oluştu.';
    if (error instanceof Error) {
      if (error.message.includes('canvas')) {
        errorMessage = 'Canvas oluşturulurken hata oluştu. Sayfayı yenilemeyi deneyin.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
      } else {
        errorMessage = `Hata: ${error.message}`;
      }
    }
    
    alert(errorMessage);
  }
};

// Basit PDF export alternatifi - sadece metin içerik için
export const exportSimplePDF = (title: string, content: string, filename: string = 'rapor') => {
  try {
    const pdf = new jsPDF();
    
    // Başlık ekle
    pdf.setFontSize(16);
    pdf.text(title, 20, 20);
    
    // İçerik ekle
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(content, 170);
    pdf.text(lines, 20, 35);
    
    // PDF'i indir
    pdf.save(`${filename}.pdf`);
    alert('PDF başarıyla indirildi!');
  } catch (error) {
    console.error('Simple PDF export hatası:', error);
    alert('PDF oluşturulurken bir hata oluştu.');
  }
};

// CSV Export fonksiyonu - genel purpose
export const exportToCSV = (data: any[], filename: string = 'data') => {
  try {
    if (!data || data.length === 0) {
      alert('Export için veri bulunamadı.');
      return;
    }

    // CSV header'ları (ilk objenin key'leri)
    const headers = Object.keys(data[0]);
    
    // CSV içeriği oluştur
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Eğer value string ise ve virgül içeriyorsa, tırnak içine al
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Blob oluştur ve indir
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('CSV export hatası:', error);
    alert('CSV export sırasında bir hata oluştu.');
  }
};

// Properties için özel CSV export
export const exportPropertiesToCSV = (properties: Property[]) => {
  const csvData = properties.map(property => ({
    'Başlık': property.title,
    'Tip': getPropertyTypeName(property.propertyType),
    'Durum': getPropertyStatusName(property.status),
    'Aracı': property.intermediaryFullName || '',
    'Telefon': property.intermediaryPhone || '',
    'Notlar': property.notes || '',
    'Oluşturma Tarihi': new Date(property.createdAt).toLocaleDateString('tr-TR')
  }));
  
  exportToCSV(csvData, 'emlaklar');
};

// Customers için özel CSV export  
export const exportCustomersToCSV = (customers: Customer[]) => {
  const csvData = customers.map(customer => ({
    'Ad Soyad': customer.fullName,
    'Telefon': customer.phone,
    'Tip': getCustomerTypeName(customer.customerType),
    'Notlar': customer.notes || '',
    'Oluşturma Tarihi': new Date(customer.createdAt).toLocaleDateString('tr-TR')
  }));
  
  exportToCSV(csvData, 'musteriler');
};

// Helper functions
const getPropertyTypeName = (type: any) => {
  switch (type) {
    case 0: return 'Arsa';
    case 1: return 'Tarla';
    case 2: return 'Daire';
    case 3: return 'İşyeri';
    case 4: return 'Hisseli';
    default: return 'Bilinmiyor';
  }
};

const getPropertyStatusName = (status: any) => {
  switch (status) {
    case 0: return 'Aktif';
    case 1: return 'Satılmış';
    case 2: return 'Arşiv';
    default: return 'Bilinmiyor';
  }
};

const getCustomerTypeName = (type: any) => {
  switch (type) {
    case 0: return 'Alıcı';
    case 1: return 'Satıcı';
    case 2: return 'Alıcı/Satıcı';
    default: return 'Bilinmiyor';
  }
}; 