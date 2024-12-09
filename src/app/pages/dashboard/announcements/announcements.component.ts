import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  Query,
  DocumentData,
} from '@angular/fire/firestore';
import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { AuthService } from '../../../auth.service';
import { AnnouncementDialogComponent } from './announcement-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface AnnouncementData {
  id?: string;
  title: string;
  description: string;
  date: string;
  audienceType: string;
  city?: string;
  district?: string;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  providers: [DatePipe],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss'],
})
export class AnnouncementsComponent implements OnInit {
  displayedColumns: string[] = [
    'id',
    'title',
    'audienceType',
    'date',
    'actions',
  ];
  dataSource = new MatTableDataSource<AnnouncementData>();

  constructor(private dialog: MatDialog, private authService: AuthService) {}

  ngOnInit(): void {
    this.getAnnouncements();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async getAnnouncements(): Promise<void> {
    const announcements: AnnouncementData[] = [];
    const firestore = getFirestore();

    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    let queryRef: Query<DocumentData>;

    if (currentUserRole === 'headquarters') {
      queryRef = collection(firestore, 'announcements') as Query<DocumentData>;
      const querySnapshot = await getDocs(queryRef);

      querySnapshot.forEach((doc) => {
        announcements.push({
          id: doc.id,
          ...doc.data(),
        } as AnnouncementData);
      });
    } else if (currentUserRole === 'city' || currentUserRole === 'district') {
      const everyoneQuery = query(
        collection(firestore, 'announcements'),
        where('audienceType', '==', 'everyone')
      );

      const roleSpecificQuery =
        currentUserRole === 'city'
          ? query(
              collection(firestore, 'announcements'),
              where('city', '==', currentUserCity),
              where('audienceType', 'in', ['city', 'district'])
            )
          : query(
              collection(firestore, 'announcements'),
              where('district', '==', currentUserDistrict),
              where('audienceType', '==', 'district')
            );

      const [everyoneSnapshot, roleSpecificSnapshot] = await Promise.all([
        getDocs(everyoneQuery),
        getDocs(roleSpecificQuery),
      ]);

      everyoneSnapshot.forEach((doc) => {
        announcements.push({ id: doc.id, ...doc.data() } as AnnouncementData);
      });

      roleSpecificSnapshot.forEach((doc) => {
        announcements.push({ id: doc.id, ...doc.data() } as AnnouncementData);
      });
    }

    this.dataSource = new MatTableDataSource(announcements);
  }

  async onAddNewAnnouncement(): Promise<void> {
    const dialogRef = this.dialog.open(AnnouncementDialogComponent, {
      width: '500px',
      data: {
        announcement: {
          id: null,
          title: '',
          description: '',
          date: '',
          audienceType: '',
        },
        readonly: false,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.createAnnouncement(result);
      }
    });
  }

  async onEditAnnouncement(event: Event, row: AnnouncementData): Promise<void> {
    event.stopPropagation();
    const dialogRef = this.dialog.open(AnnouncementDialogComponent, {
      width: '500px',
      data: { announcement: row, readonly: false },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.updateAnnouncement(result);
      }
    });
  }

  async deleteAnnouncement(event: Event, row: AnnouncementData): Promise<void> {
    event.stopPropagation();

    if (!row.id) {
      console.error(
        'Announcement ID is undefined. Cannot delete the announcement.'
      );
      return;
    }

    if (confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
      try {
        const firestore = getFirestore();
        const announcementRef = doc(firestore, 'announcements', row.id);
        await deleteDoc(announcementRef);
        this.getAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  }

  async createAnnouncement(data: AnnouncementData): Promise<void> {
    const { id, ...rest } = data;
    await addDoc(collection(getFirestore(), 'announcements'), rest);
    this.getAnnouncements();
  }

  async updateAnnouncement(data: AnnouncementData): Promise<void> {
    await setDoc(doc(getFirestore(), 'announcements', data.id!), data);
    this.getAnnouncements();
  }

  formatDate(date: string): string {
    return formatDate(date, 'dd.MM.yyyy', 'en-US');
  }

  getAudienceText(audienceType: string): string {
    const audienceMap: { [key: string]: string } = {
      everyone: 'Herkes',
      headquarters: 'Genel Merkez',
      city: 'Şehir',
      district: 'İlçe',
    };
    return audienceMap[audienceType] || 'Bilinmeyen';
  }

  openDisplayDialog(announcementData: AnnouncementData): void {
    this.dialog.open(AnnouncementDialogComponent, {
      width: '500px',
      data: { announcement: announcementData, readonly: true },
    });
  }
}
