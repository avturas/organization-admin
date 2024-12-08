import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth.service';
import { formatDate } from '@angular/common';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  Query,
  DocumentData,
} from '@angular/fire/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { MatDialog } from '@angular/material/dialog';
import { addDoc, deleteDoc, doc, updateDoc } from '@firebase/firestore';
import { EventDialogComponent } from './event-dialog.component';

export interface EventData {
  id: string;
  name: string;
  date: string;
  city: string;
  district: string;
  owner: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-events',
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
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit {
  dataSource = new MatTableDataSource<EventData>();
  displayedColumns: string[] = [
    'id',
    'date',
    'city',
    'district',
    'name',
    'actions',
  ];

  constructor(private authService: AuthService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.getEvents();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async onAddNewEvent(): Promise<void> {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '500px',
      data: {
        event: {
          id: null,
          name: '',
          date: '',
          city: '',
          district: '',
          owner: this.authService.getUserRole(),
        },
        readOnly: false,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const firestore = getFirestore();
          await addDoc(collection(firestore, 'events'), result);
          this.getEvents();
        } catch (error) {
          console.error('Error adding event:', error);
        }
      }
    });
  }

  async deleteImageFromStorage(imageUrl: string): Promise<void> {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, imageUrl);
      await deleteObject(fileRef);
      console.log('Old image deleted successfully');
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  async onChangeEvent(event: Event, row: EventData): Promise<void> {
    event.stopPropagation();
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '500px',
      data: { event: row, readonly: false },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const firestore = getFirestore();
          const eventRef = doc(firestore, 'events', row.id);
          await updateDoc(eventRef, result);

          if (row.imageUrl && result.imageUrl !== row.imageUrl) {
            await this.deleteImageFromStorage(row.imageUrl);
          }
          this.getEvents();
        } catch (error) {
          console.error('Error updating event:', error);
        }
      }
    });
  }

  async deleteEvent(event: Event, row: EventData): Promise<void> {
    event.stopPropagation();
    if (confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
      try {
        const firestore = getFirestore();
        const eventRef = doc(firestore, 'events', row.id);
        await deleteDoc(eventRef);
        if (row.imageUrl) {
          await this.deleteImageFromStorage(row.imageUrl);
        }
        this.getEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  }

  formatDate(date: string): string {
    return formatDate(date, 'dd.MM.yyyy', 'en-US');
  }

  async getEvents(): Promise<void> {
    const events: EventData[] = [];
    const firestore = getFirestore();

    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    let queryRef: Query<DocumentData>;

    if (currentUserRole === 'headquarters') {
      queryRef = collection(firestore, 'events') as Query<DocumentData>;
    } else if (currentUserRole === 'city') {
      queryRef = query(
        collection(firestore, 'events'),
        where('city', '==', currentUserCity)
      );
    } else if (currentUserRole === 'district') {
      queryRef = query(
        collection(firestore, 'events'),
        where('district', '==', currentUserDistrict)
      );
    } else {
      throw new Error('Invalid role or missing role information');
    }

    const querySnapshot = await getDocs(queryRef); // Fetch data from Firestore
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data(),
      } as EventData);
    });

    this.dataSource = new MatTableDataSource(events); // Update table data source
  }

  openDisplayDialog(eventData: EventData): void {
    this.dialog.open(EventDialogComponent, {
      width: '500px',
      data: { event: eventData, readonly: true },
    });
  }
}
