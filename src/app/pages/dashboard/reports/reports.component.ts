import { Component, OnInit } from '@angular/core';
import { ChartOptions, ChartType } from 'chart.js';
import { ChartDataset } from 'chart.js';
import { AuthService } from '../../../auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MatNativeDateModule } from '@angular/material/core';
import {
  collection,
  getFirestore,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { CITIES } from '../../../shared/cities';
import { DISTRICTS } from '../../../shared/districts';

function convertTurkishToEnglish(text: string): string {
  const turkishToEnglishMap: { [key: string]: string } = {
    ç: 'c',
    Ç: 'C',
    ğ: 'g',
    Ğ: 'G',
    ı: 'i',
    İ: 'I',
    ö: 'o',
    Ö: 'O',
    ş: 's',
    Ş: 'S',
    ü: 'u',
    Ü: 'U',
  };

  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => turkishToEnglishMap[match]);
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    BaseChartDirective,
    FormsModule,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  availableCities = Object.entries(CITIES).map(([key, value]) => ({
    key,
    value,
  }));
  filteredDistricts: string[] = [];
  selectedCity: string | null = null;
  selectedDistrict: string | null = null;
  isCityDisabled = false;
  isDistrictDisabled = false;
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  currentUserRole: string | null = '';
  currentUserDistrict: string | null = '';

  totalEventCount = 0;

  generalChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        ticks: {
          precision: 0,
        },
      },
      y: {
        ticks: {
          precision: 0,
          callback: (value) => Number(value).toFixed(0),
        },
      },
    },
  };

  eventsPerMonthLabels: string[] = [];
  eventsPerMonthData: ChartDataset[] = [];
  eventsPerMonthChartType: ChartType = 'line';

  eventsByTypeLabels: string[] = [];
  eventsByTypeData: ChartDataset[] = [];
  eventsByTypeChartType: ChartType = 'bar';

  topCitiesLabels: string[] = [];
  topCitiesData: ChartDataset[] = [];
  topCitiesChartType: ChartType = 'bar';

  topDistrictsLabels: string[] = [];
  topDistrictsData: ChartDataset[] = [];
  topDistrictsChartType: ChartType = 'bar';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.initializeFilters();
    this.loadInitialReports();

    const today = new Date();
    this.filterEndDate = new Date();
    this.filterStartDate = new Date(today.setMonth(today.getMonth() - 6));
  }

  onCityChange(selectedCity: string): void {
    this.currentUserRole = this.authService.getUserRole();
    this.currentUserDistrict = this.authService.getUserDistrict();

    if (this.currentUserRole === 'district') {
      this.filteredDistricts = this.currentUserDistrict
        ? [this.currentUserDistrict]
        : [];
      this.selectedDistrict = this.currentUserDistrict;
      return;
    }

    const cityName = this.availableCities.find(
      (city) => city.value === selectedCity
    )?.value;

    this.filteredDistricts = cityName ? DISTRICTS[cityName] || [] : [];
    this.selectedDistrict = null;
  }

  private initializeFilters(): void {
    this.currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (this.currentUserRole === 'headquarters') {
      this.isCityDisabled = false;
      this.isDistrictDisabled = false;
    } else if (this.currentUserRole === 'city') {
      this.isCityDisabled = true;
      this.isDistrictDisabled = false;
      this.selectedCity = currentUserCity;
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
      if (currentUserCity) {
        this.onCityChange(currentUserCity);
      }
    } else if (this.currentUserRole === 'district') {
      this.isCityDisabled = true;
      this.isDistrictDisabled = true;
      this.selectedCity = currentUserCity;
      this.selectedDistrict = currentUserDistrict;
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
    }
  }

  async applyFilters(): Promise<void> {
    const filters: {
      city?: string;
      district?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (this.selectedCity) {
      filters.city = this.selectedCity;
    }
    if (this.selectedDistrict) {
      filters.district = this.selectedDistrict;
    }
    if (this.filterStartDate) {
      filters.startDate = this.filterStartDate;
    }
    if (this.filterEndDate) {
      filters.endDate = this.filterEndDate;
    }

    await this.loadReports(filters);
  }

  private async loadReports(filters: {
    city?: string;
    district?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<void> {
    const firestore = getFirestore();
    const eventsRef = collection(firestore, 'events');
    let queries = [];

    if (filters.city) {
      queries.push(where('city', '==', filters.city));
    }
    if (filters.district) {
      queries.push(where('district', '==', filters.district));
    }
    if (filters.startDate) {
      queries.push(where('date', '>=', filters.startDate.toISOString()));
    }
    if (filters.endDate) {
      queries.push(where('date', '<=', filters.endDate.toISOString()));
    }

    const q = query(eventsRef, ...queries);
    const querySnapshot = await getDocs(q);

    const eventData = querySnapshot.docs.map((doc) => doc.data() as any);
    this.totalEventCount = eventData.length;
    this.updateCharts(eventData);
  }

  private updateCharts(eventData: any[]): void {
    const eventsPerMonth: { [key: string]: number } = {};
    eventData.forEach((event) => {
      const month = new Date(event.date).toLocaleString('tr-TR', {
        month: 'long',
      });
      eventsPerMonth[month] = (eventsPerMonth[month] || 0) + 1;
    });

    this.eventsPerMonthLabels = Object.keys(eventsPerMonth);
    this.eventsPerMonthData = [
      { data: Object.values(eventsPerMonth), label: 'Ay' },
    ];

    const eventsByType: { [key: string]: number } = {};
    eventData.forEach((event) => {
      const type = event.eventType || 'Bilinmiyor';
      eventsByType[type] = (eventsByType[type] || 0) + 1;
    });

    this.eventsByTypeLabels = Object.keys(eventsByType);
    this.eventsByTypeData = [
      { data: Object.values(eventsByType), label: 'Etkinlik Çeşidi' },
    ];

    const citiesCount: { [key: string]: number } = {};
    eventData.forEach((event) => {
      if (!event.city) return;
      const city = event.city || 'Bilinmiyor';
      citiesCount[city] = (citiesCount[city] || 0) + 1;
    });

    const sortedCities = Object.entries(citiesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    this.topCitiesLabels = sortedCities.map(([city]) => city);
    this.topCitiesData = [
      {
        data: sortedCities.map(([, count]) => count),
        label: 'İl',
      },
    ];

    const districtsCount: { [key: string]: number } = {};
    eventData.forEach((event) => {
      if (!event.city || !event.district) return;
      const district = event.district || 'Bilinmiyor';
      districtsCount[district] = (districtsCount[district] || 0) + 1;
    });

    const sortedDistricts = Object.entries(districtsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    this.topDistrictsLabels = sortedDistricts.map(([district]) => district);
    this.topDistrictsData = [
      {
        data: sortedDistricts.map(([, count]) => count),
        label: 'İlçe',
      },
    ];
  }

  async exportToPDF(): Promise<void> {
    const doc = new jsPDF('landscape');

    const reportsWrapper = document.querySelector(
      '.reports-wrapper'
    ) as HTMLElement;

    const filtersText = `
  Sehir: ${convertTurkishToEnglish(this.selectedCity || 'Tümü')}
  Ilce: ${convertTurkishToEnglish(this.selectedDistrict || 'Tümü')}
  Baslangic Tarihi: ${
    this.filterStartDate
      ? this.filterStartDate.toLocaleDateString()
      : 'Belirtilmedi'
  }
  Bitis Tarihi: ${
    this.filterEndDate
      ? this.filterEndDate.toLocaleDateString()
      : 'Belirtilmedi'
  }
`;

    doc.setFontSize(8);
    const lineHeight = 10;
    const startX = 10;
    const startY = 10;
    const filtersArray = filtersText.split('\n');

    filtersArray.forEach((line, index) => {
      doc.text(line, startX, startY + index * lineHeight);
    });

    if (reportsWrapper) {
      const canvas = await html2canvas(reportsWrapper, {
        scale: 4,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      doc.addImage(
        imgData,
        'PNG',
        0,
        startY + filtersArray.length * lineHeight + 10,
        pdfWidth,
        pdfHeight
      );

      doc.save('reports.pdf');
    } else {
      console.error('Element with class "reports-wrapper" not found!');
    }
  }

  private loadInitialReports(): void {
    this.applyFilters();
  }

  clearFilters() {
    this.selectedCity = null;
    this.selectedDistrict = null;
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.initializeFilters();
  }
}
