import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [MatCardModule, CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
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

  constructor() {}

  ngOnInit(): void {}
}
