import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../auth.service';
import {
  collection,
  getFirestore,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  Query,
  DocumentData,
} from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

const USER_ROLE_TEXT = {
  headquarters: 'GENEL MERKEZ',
  city: 'İl',
  district: 'İlçe',
};

interface EventData {
  name: string;
  date: string;
  city: string;
  district: string;
}

interface AnnouncementData {
  title: string;
  date: string;
  description: string;
  city: string;
  district: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [MatCardModule, CommonModule, MatIconModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  userInfo = {
    name: '',
    email: '',
    role: '',
    city: '',
    district: '',
  };
  lastFiveEvents: EventData[] = [];
  upcomingFiveEvents: EventData[] = [];
  latestAnnouncements: AnnouncementData[] = [];
  importantLinks = [
    { name: 'Home', url: '/' },
    { name: 'Reports', url: '/reports' },
    { name: 'Social Media', url: 'https://www.example.com' },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadLastFiveEvents();
    this.loadUpcomingFiveEvents();
    this.loadLatestAnnouncements();
  }

  private async loadUserInfo(): Promise<void> {
    const user = await this.authService.getUserInfo();
    this.userInfo = {
      name: user?.name || 'N/A',
      email: user?.email || 'N/A',
      role:
        USER_ROLE_TEXT[
          this.authService.getUserRole() as keyof typeof USER_ROLE_TEXT
        ] || 'N/A',
      city: this.authService.getUserCity() || 'N/A',
      district: this.authService.getUserDistrict() || 'N/A',
    };
  }

  private async loadLastFiveEvents(): Promise<void> {
    const firestore = getFirestore();
    const today = new Date().toISOString();
    const eventsRef = collection(firestore, 'events');

    const userRole = this.authService.getUserRole();
    const userCity = this.authService.getUserCity();
    const userDistrict = this.authService.getUserDistrict();

    let q: Query<DocumentData>;

    if (userRole === 'headquarters') {
      q = query(
        eventsRef,
        where('date', '<', today),
        orderBy('date', 'desc'),
        limit(5)
      );
    } else if (userRole === 'city' && userCity) {
      q = query(
        eventsRef,
        where('city', '==', userCity),
        where('date', '<', today),
        orderBy('date', 'desc'),
        limit(5)
      );
    } else if (userRole === 'district' && userDistrict) {
      q = query(
        eventsRef,
        where('district', '==', userDistrict),
        where('date', '<', today),
        orderBy('date', 'desc'),
        limit(5)
      );
    } else {
      throw new Error('Invalid user role or missing user data');
    }

    const snapshot = await getDocs(q);
    this.lastFiveEvents = snapshot.docs.map((doc) => doc.data() as EventData);
  }

  private async loadUpcomingFiveEvents(): Promise<void> {
    const firestore = getFirestore();
    const today = new Date().toISOString();
    const eventsRef = collection(firestore, 'events');

    const userRole = this.authService.getUserRole();
    const userCity = this.authService.getUserCity();
    const userDistrict = this.authService.getUserDistrict();

    let q: Query<DocumentData>;

    if (userRole === 'headquarters') {
      q = query(
        eventsRef,
        where('date', '>=', today),
        orderBy('date', 'asc'),
        limit(5)
      );
    } else if (userRole === 'city' && userCity) {
      q = query(
        eventsRef,
        where('city', '==', userCity),
        where('date', '>=', today),
        orderBy('date', 'asc'),
        limit(5)
      );
    } else if (userRole === 'district' && userDistrict) {
      q = query(
        eventsRef,
        where('district', '==', userDistrict),
        where('date', '>=', today),
        orderBy('date', 'asc'),
        limit(5)
      );
    } else {
      throw new Error('Invalid user role or missing user data');
    }

    const snapshot = await getDocs(q);
    this.upcomingFiveEvents = snapshot.docs.map(
      (doc) => doc.data() as EventData
    );
  }

  private async loadLatestAnnouncements(): Promise<void> {
    const firestore = getFirestore();
    const announcementsRef = collection(firestore, 'announcements');

    const userRole = this.authService.getUserRole();
    const userCity = this.authService.getUserCity();
    const userDistrict = this.authService.getUserDistrict();

    let q: Query<DocumentData>;

    if (userRole === 'headquarters') {
      q = query(announcementsRef, orderBy('date', 'desc'), limit(10));
    } else if (userRole === 'city' && userCity) {
      q = query(
        announcementsRef,
        where('audienceType', 'in', ['everyone', 'city']),
        where('city', '==', userCity),
        orderBy('date', 'desc'),
        limit(10)
      );
    } else if (userRole === 'district' && userDistrict) {
      q = query(
        announcementsRef,
        where('audienceType', 'in', ['everyone', 'district']),
        where('district', '==', userDistrict),
        orderBy('date', 'desc'),
        limit(10)
      );
    } else {
      throw new Error('Invalid user role or missing user data');
    }

    const snapshot = await getDocs(q);
    this.latestAnnouncements = snapshot.docs.map(
      (doc) => doc.data() as AnnouncementData
    );
  }
}
