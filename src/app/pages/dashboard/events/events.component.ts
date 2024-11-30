import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';

import { BreakpointObserver } from '@angular/cdk/layout';
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  updateDoc,
  setDoc,
  addDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { MatIconModule } from '@angular/material/icon';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import sortBy from 'lodash/sortBy';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { AuthService } from '../../../auth.service';

export interface EventData {
  id: string;
  name: string;
  owner: string;
  date: string;
  place: string;
  type: string;
  purpose: string;
  numberOfParticipants: string;
  importantParticipants: string;
  focusGroup: string;
  budget: string;
  expenses: string;
  revenues: string;
  notes: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    FormsModule,
    CommonModule,
    MatIconModule,
  ],
  providers: [DatePipe],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss',
})
export class EventsComponent {
  displayedColumns: string[] = ['id', 'owner', 'date', 'name', 'actions'];
  dataSource: MatTableDataSource<EventData> = new MatTableDataSource();
  isMobile = false;

  @ViewChild(MatPaginator) paginator: MatPaginator = new MatPaginator(
    new MatPaginatorIntl(),
    ChangeDetectorRef.prototype
  );
  @ViewChild(MatSort) sort: MatSort = new MatSort();

  constructor(
    public dialog: MatDialog,
    private datePipe: DatePipe,
    public authService: AuthService,
    breakpointObserver: BreakpointObserver
  ) {
    this.getEvents();
    breakpointObserver.observe(['(max-width: 600px)']).subscribe((result) => {
      this.displayedColumns = result.matches
        ? ['owner', 'name', 'actions']
        : ['id', 'owner', 'date', 'name', 'actions'];
    });
  }

  async updateEmail(email: string, id: string) {
    const userRef = doc(getFirestore(), 'users', id);
    await updateDoc(userRef, {
      email,
    });
    this.getEvents();
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy')!;
  }

  async deleteEvent(event: any, row: EventData) {
    event.stopPropagation();
    if (confirm('Bu etkinliği silmek üzeresiniz, emin misiniz?')) {
      await deleteDoc(doc(getFirestore(), 'events', row.id));
      this.getEvents();
    }
  }

  createEmptyEvent(): EventData {
    return {
      id: '',
      name: '',
      owner: '',
      date: '',
      place: '',
      type: '',
      purpose: '',
      numberOfParticipants: '',
      importantParticipants: '',
      focusGroup: '',
      budget: '',
      expenses: '',
      revenues: '',
      notes: '',
    };
  }

  async createEvent(data: EventData) {
    const { id, ...rest } = data;
    await addDoc(collection(getFirestore(), 'events'), rest);
    this.getEvents();
  }

  async updateEvent(data: EventData) {
    await setDoc(doc(getFirestore(), 'events', data.id), data);
    this.getEvents();
  }

  openDialog(row: EventData): void {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      data: row,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.id) {
          this.updateEvent(result);
        } else {
          this.createEvent(result);
        }
      }
    });
  }

  openDisplayDialog(row: EventData): void {
    this.dialog.open(EventDialogDisplayComponent, {
      data: row,
    });
  }

  onAddNewEvent = () => {
    const emptyEvent = this.createEmptyEvent();
    this.openDialog(emptyEvent);
  };

  async getEvents() {
    const events: EventData[] = [];
    const querySnapshot = await getDocs(collection(getFirestore(), 'events'));
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        name: doc.data()['name'],
        owner: doc.data()['owner'],
        date: doc.data()['date'],
        place: doc.data()['place'],
        type: doc.data()['type'],
        purpose: doc.data()['purpose'],
        numberOfParticipants: doc.data()['numberOfParticipants'],
        importantParticipants: doc.data()['importantParticipants'],
        focusGroup: doc.data()['focusGroup'],
        budget: doc.data()['focusGroup'],
        expenses: doc.data()['expenses'],
        revenues: doc.data()['revenues'],
        notes: doc.data()['notes'],
      });
    });
    this.dataSource = new MatTableDataSource(sortBy(events, 'date'));
  }

  onChangeEvent(event: any, row: EventData) {
    event.stopPropagation();
    this.openDialog(row);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

@Component({
  selector: 'event-dialog',
  templateUrl: 'event-dialog.html',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatSelectModule,
  ],
  styles: [
    `
      form {
        display: flex;
        flex-direction: column;

        @media (min-width: 600px) {
          min-width: 800px;
        }
      }
    `,
  ],
})
export class EventDialogComponent {
  eventForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EventDialogComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: EventData
  ) {
    this.eventForm = this.fb.group({
      id: [data.id],
      owner: ['', Validators.required],
      name: [data.name, Validators.required],
      date: [data.date ? new Date(data.date) : '', Validators.required],
      place: [data.place, Validators.required],
      type: [data.type, Validators.required],
      purpose: [data.purpose, Validators.required],
      numberOfParticipants: [data.numberOfParticipants, Validators.required],
      importantParticipants: [data.importantParticipants],
      focusGroup: [data.focusGroup],
      budget: [data.budget, Validators.required],
      expenses: [data.expenses],
      revenues: [data.revenues],
      notes: [data.notes],
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;
      formValue.date = formValue.date.toISOString();
      this.dialogRef.close(this.eventForm.value);
    }
  }
}

@Component({
  selector: 'event-dialog-display',
  templateUrl: 'event-dialog-display.html',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatSelectModule,
  ],
  styles: [
    `
      form {
        display: flex;
        flex-direction: column;

        @media (min-width: 600px) {
          min-width: 800px;
        }
      }
    `,
  ],
})
export class EventDialogDisplayComponent {
  eventForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EventDialogComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: EventData
  ) {
    this.eventForm = this.fb.group({
      id: [data.id],
      owner: ['', Validators.required],
      name: [data.name, Validators.required],
      date: [data.date ? new Date(data.date) : '', Validators.required],
      place: [data.place, Validators.required],
      type: [data.type, Validators.required],
      purpose: [data.purpose, Validators.required],
      numberOfParticipants: [data.numberOfParticipants, Validators.required],
      importantParticipants: [data.importantParticipants],
      focusGroup: [data.focusGroup],
      budget: [data.budget, Validators.required],
      expenses: [data.expenses],
      revenues: [data.revenues],
      notes: [data.notes],
    });
  }
}
