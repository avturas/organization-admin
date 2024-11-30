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
import { FormsModule } from '@angular/forms';
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

export interface UserData {
  uid: string;
  il: string;
  ilce: string;
  email: string;
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
  displayedColumns: string[] = ['uid', 'il', 'ilce', 'email', 'actions'];
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
        : ['uid', 'il', 'ilce', 'email', 'actions'];
    });
  }

  async updateEmail(email: string, id: string) {
    const userRef = doc(getFirestore(), 'users', id);
    await updateDoc(userRef, {
      email,
    });
    this.getUsers();
  }

  openDialog(id: string): void {
    const dialogRef = this.dialog.open(ChangeEmailDialog, {
      data: { id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateEmail(result.email, result.id);
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
        il: doc.data()['city'],
        ilce: doc.data()['district'],
        email: doc.data()['email'],
      });
    });
    this.dataSource = new MatTableDataSource(users);
  }

  onChangeEmail(id: string) {
    this.openDialog(id);
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
  templateUrl: 'phone-dialog.html',
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
  ],
})
export class ChangeEmailDialog {
  constructor(
    public dialogRef: MatDialogRef<ChangeEmailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
