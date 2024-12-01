import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
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
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthService } from '../../../auth.service';
import { MatSelectModule } from '@angular/material/select';
import { CITIES } from '../../../shared/cities';
import { CommonModule } from '@angular/common';
import { DISTRICTS } from '../../../shared/districts';

export interface UserData {
  uid: string;
  name: string;
  surname: string;
  city: string;
  district: string;
  email: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    FormsModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  displayedColumns: string[] = [
    'uid',
    'city',
    'district',
    'name',
    'surname',
    'email',
    'phoneNumber',
    'actions',
  ];
  dataSource: MatTableDataSource<UserData> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator: MatPaginator = new MatPaginator(
    new MatPaginatorIntl(),
    ChangeDetectorRef.prototype
  );
  @ViewChild(MatSort) sort: MatSort = new MatSort();

  constructor(
    public dialog: MatDialog,
    breakpointObserver: BreakpointObserver
  ) {
    this.getUsers();
    breakpointObserver.observe(['(max-width: 600px)']).subscribe((result) => {
      this.displayedColumns = result.matches
        ? ['email', 'actions']
        : [
            'uid',
            'city',
            'district',
            'name',
            'surname',
            'email',
            'phoneNumber',
            'actions',
          ];
    });
  }

  async updateUser(data: UserData) {
    const userRef = doc(getFirestore(), 'users', data.uid);
    await updateDoc(userRef, {
      ...data,
    });
    this.getUsers();
  }

  openDialog(data: UserData): void {
    const dialogRef = this.dialog.open(UserDialog, {
      data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateUser(result);
      }
      console.log(result);
    });
  }

  async getUsers() {
    const users: UserData[] = [];
    const querySnapshot = await getDocs(collection(getFirestore(), 'users'));
    querySnapshot.forEach((doc) => {
      users.push({
        uid: doc.id,
        city: doc.data()['city'],
        district: doc.data()['district'],
        email: doc.data()['email'],
        name: doc.data()['name'],
        surname: doc.data()['surname'],
        phoneNumber: doc.data()['phoneNumber'],
      });
    });
    this.dataSource = new MatTableDataSource(users);
  }

  createEmptyUser(): UserData {
    return {
      uid: '',
      name: '',
      surname: '',
      city: '',
      district: '',
      email: '',
      phoneNumber: '',
    };
  }

  onAddNewUser() {
    const emptyUser = this.createEmptyUser();
    this.openDialog(emptyUser);
  }

  openUpdateUserDialog(row: UserData) {
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

export interface DialogData {
  id: string;
  phoneNumber: string;
}

@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'user-dialog.html',
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
    ReactiveFormsModule,
    MatSelectModule,
    CommonModule,
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
export class UserDialog {
  userForm: FormGroup;
  districts = DISTRICTS;
  cities = CITIES;
  filteredDistricts: string[] = [];
  sortedCities = Object.entries(CITIES)
    .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
    .map(([key, value]) => ({ key, value })); // Keep keys sorted numerically

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserDialog>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: UserData
  ) {
    this.userForm = this.fb.group({
      uid: [data.uid],
      name: [data.name, Validators.required],
      surname: [data.surname, Validators.required],
      city: [data.surname, Validators.required],
      district: [data.surname, Validators.required],
      email: [data.surname, [Validators.required, Validators.email]],
      phoneNumber: [data.phoneNumber, Validators.required],
    });
  }

  onCityChange(selectedCity: string): void {
    const cityName = this.cities[selectedCity];
    this.filteredDistricts = cityName ? this.districts[cityName] || [] : [];
    this.userForm.controls['district'].reset();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      formValue.date = formValue.date.toISOString();
      this.dialogRef.close(this.userForm.value);
    }
  }
}
