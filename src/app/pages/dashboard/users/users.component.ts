import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  doc,
  updateDoc,
  Query,
  DocumentData,
  addDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../auth.service';
import { UserDialog } from './user-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog.component';

export interface UserData {
  uid: string;
  name: string;
  surname: string;
  role: string;
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
  styleUrls: ['./users.component.scss'],
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
  dataSource = new MatTableDataSource<UserData>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private dialog: MatDialog, private authService: AuthService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  async fetchUsers() {
    const userRole = this.authService.getUserRole();
    const userCity = this.authService.getUserCity();
    const userDistrict = this.authService.getUserDistrict();

    let userQuery: Query<DocumentData>;
    const usersCollection = collection(getFirestore(), 'users');

    if (userRole === 'city') {
      userQuery = query(usersCollection, where('city', '==', userCity));
    } else if (userRole === 'district') {
      userQuery = query(
        usersCollection,
        where('city', '==', userCity),
        where('district', '==', userDistrict)
      );
    } else {
      userQuery = usersCollection;
    }

    const querySnapshot = await getDocs(userQuery);
    const users = querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as UserData[];

    this.dataSource.data = users;
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

  onAddNewUser(): void {
    const emptyUser = this.createEmptyUser();
    this.openDialog(emptyUser);
  }

  openDialog(data: UserData): void {
    const dialogRef = this.dialog.open(UserDialog, {
      width: '400px',
      data,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          if (data.uid) {
            await this.updateUser(result);
          } else {
            delete result.uid;
            await this.addUserToFirestore(result);
          }
          this.fetchUsers();
        } catch (error) {
          console.error('Error saving user:', error);
        }
      }
    });
  }

  openUpdateUserDialog(row: UserData): void {
    this.openDialog(row);
  }

  private async addUserToFirestore(user: Omit<UserData, 'uid'>): Promise<void> {
    const firestore = getFirestore();
    const usersCollection = collection(firestore, 'users');
    await addDoc(usersCollection, user);
  }

  async updateUser(data: UserData) {
    const userRef = doc(getFirestore(), 'users', data.uid);
    const updateData: { [key: string]: any } = { ...data };
    await updateDoc(userRef, updateData);
    this.fetchUsers();
  }

  onDeleteUser(user: UserData): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialog);

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          const userRef = doc(getFirestore(), 'users', user.uid);
          await deleteDoc(userRef);
          this.fetchUsers();
          console.log(`User with UID: ${user.uid} deleted successfully`);
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      }
    });
  }

  createEmptyUser(): UserData {
    return {
      uid: '',
      name: '',
      role: '',
      surname: '',
      city: '',
      district: '',
      email: '',
      phoneNumber: '',
    };
  }
}
