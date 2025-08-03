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

  async ngOnInit(): Promise<void> {
    await this.loadUserInfo();
    await this.loadLastFiveEvents();
    await this.loadUpcomingFiveEvents();
    await this.loadLatestAnnouncements();
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
        where('city', '==', userCity),
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
        where('city', '==', userCity),
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

    const queries: Query<DocumentData>[] = [];

    queries.push(
      query(announcementsRef, where('audienceType', '==', 'everyone'))
    );

    if (userRole === 'headquarters') {
      queries.push(
        query(announcementsRef, where('audienceType', '==', 'headquarters'))
      );
      queries.push(
        query(announcementsRef, where('audienceType', '==', 'city'))
      );
      queries.push(
        query(announcementsRef, where('audienceType', '==', 'district'))
      );
    }

    if (userRole === 'city' && userCity) {
      queries.push(
        query(
          announcementsRef,
          where('audienceType', '==', 'city'),
          where('city', '==', userCity)
        )
      );
      queries.push(
        query(
          announcementsRef,
          where('audienceType', '==', 'district'),
          where('city', '==', userCity)
        )
      );
    }

    if (userRole === 'district' && userCity && userDistrict) {
      queries.push(
        query(
          announcementsRef,
          where('audienceType', '==', 'district'),
          where('city', '==', userCity),
          where('district', '==', userDistrict)
        )
      );
    }

    const snapshots = await Promise.all(queries.map((q) => getDocs(q)));

    const seen = new Set<string>();
    const announcements: AnnouncementData[] = [];
    for (const snap of snapshots) {
      snap.forEach((doc) => {
        if (!seen.has(doc.id)) {
          announcements.push(doc.data() as AnnouncementData);
          seen.add(doc.id);
        }
      });
    }

    this.latestAnnouncements = announcements;
  }
}
