import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BreakpointObserver } from '@angular/cdk/layout';
import { sortBy } from 'lodash';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';

export interface AnnouncementData {
  id: string;
  title: string;
  description: string;
  date: string;
}

@Component({
  selector: 'app-announcements',
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
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss',
})
export class AnnouncementsComponent {
  displayedColumns: string[] = [
    'id',
    'title',
    'description',
    'date',
    'actions',
  ];
  dataSource: MatTableDataSource<AnnouncementData> = new MatTableDataSource();
  isMobile = false;

  @ViewChild(MatPaginator) paginator: MatPaginator = new MatPaginator(
    new MatPaginatorIntl(),
    ChangeDetectorRef.prototype
  );
  @ViewChild(MatSort) sort: MatSort = new MatSort();

  constructor(
    public dialog: MatDialog,
    private datePipe: DatePipe,
    breakpointObserver: BreakpointObserver
  ) {
    this.getAnnouncements();
    breakpointObserver.observe(['(max-width: 600px)']).subscribe((result) => {
      this.displayedColumns = result.matches
        ? ['title', 'description', 'date', 'actions']
        : ['id', 'title', 'description', 'date', 'actions'];
    });
  }

  async updateEmail(email: string, id: string) {
    const userRef = doc(getFirestore(), 'users', id);
    await updateDoc(userRef, {
      email,
    });
    this.getAnnouncements();
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy')!;
  }

  async deleteAnnouncement(event: any, row: AnnouncementData) {
    event.stopPropagation();
    if (confirm('Bu duyuruyu silmek üzeresiniz, emin misiniz?')) {
      await deleteDoc(doc(getFirestore(), 'announcements', row.id));
      this.getAnnouncements();
    }
  }

  createEmptyAnnouncement(): AnnouncementData {
    return {
      id: '',
      title: '',
      description: '',
      date: '',
    };
  }

  async createAnnouncement(data: AnnouncementData) {
    const { id, ...rest } = data;
    await addDoc(collection(getFirestore(), 'announcements'), rest);
    this.getAnnouncements();
  }

  async updateAnnouncement(data: AnnouncementData) {
    await setDoc(doc(getFirestore(), 'announcements', data.id), data);
    this.getAnnouncements();
  }

  openDialog(row: AnnouncementData): void {
    const dialogRef = this.dialog.open(AnnouncementDialogComponent, {
      data: row,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.id) {
          this.updateAnnouncement(result);
        } else {
          this.createAnnouncement(result);
        }
      }
    });
  }

  onAddNewAnnouncement = () => {
    const emptyAnnouncement = this.createEmptyAnnouncement();
    this.openDialog(emptyAnnouncement);
  };

  async getAnnouncements() {
    const announcements: AnnouncementData[] = [];
    const querySnapshot = await getDocs(
      collection(getFirestore(), 'announcements')
    );
    querySnapshot.forEach((doc) => {
      announcements.push({
        id: doc.id,
        title: doc.data()['title'],
        description: doc.data()['description'],
        date: doc.data()['date'],
      });
    });
    this.dataSource = new MatTableDataSource(sortBy(announcements, 'date'));
  }

  onChangeEvent(event: any, row: AnnouncementData) {
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
  selector: 'announcement-dialog',
  templateUrl: 'announcement-dialog.html',
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
export class AnnouncementDialogComponent {
  announcementForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AnnouncementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AnnouncementData
  ) {
    this.announcementForm = this.fb.group({
      id: [data.id],
      title: [data.title, Validators.required],
      description: [data.description, Validators.required],
      date: [data.date ? new Date(data.date) : '', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.announcementForm.valid) {
      const formValue = this.announcementForm.value;
      formValue.date = formValue.date.toISOString();
      this.dialogRef.close(this.announcementForm.value);
    }
  }
}
