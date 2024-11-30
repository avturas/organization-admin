import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChartOptions, ChartType } from 'chart.js';
import { ChartDataset } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [MatCardModule, BaseChartDirective, CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  // Chart options
  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartLabels: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
  ];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  // Chart data
  public barChartData: ChartDataset[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' },
  ];

  // Sample data for event counts and recent/upcoming events
  public totalEventCounts: number = 100;
  public lastFiveEvents: string[] = [
    'Event 1',
    'Event 2',
    'Event 3',
    'Event 4',
    'Event 5',
  ];
  public upcomingFiveEvents: string[] = [
    'Event 6',
    'Event 7',
    'Event 8',
    'Event 9',
    'Event 10',
  ];

  // Chart options for events by type
  public eventTypesOptions: ChartOptions = {
    responsive: true,
  };
  public eventTypesLabels: string[] = [
    'Type A',
    'Type B',
    'Type C',
    'Type D',
    'Type E',
  ];
  public eventTypesLegend = true;
  public eventTypesChartType: ChartType = 'bar';

  // Sample data for events by type
  public eventTypesData: ChartDataset[] = [
    { data: [10, 20, 30, 40, 50], label: 'Etkinlik Çeşidi' },
  ];

  constructor() {}

  ngOnInit(): void {}
}
