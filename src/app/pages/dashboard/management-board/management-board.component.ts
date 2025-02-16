import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getFirestore,
  Query,
  DocumentData,
} from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ManagementBoardDialogComponent } from './management-board-dialog.component';
import { FormsModule } from '@angular/forms';

export interface ManagementBoardData {
  id?: string;
  name: string;
  role: string;
  hubType: string;
  city?: string;
  district?: string;
}

@Component({
    selector: 'app-management-board',
    imports: [
        CommonModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatCheckboxModule,
        FormsModule,
    ],
    templateUrl: './management-board.component.html',
    styleUrls: ['./management-board.component.scss']
})
export class ManagementBoardComponent implements OnInit {
  displayedColumns: string[] = ['name', 'role', 'city', 'district', 'actions'];
  dataSource = new MatTableDataSource<ManagementBoardData>();
  onlyDisplayHeadquarters = false;
  onlyDisplayCityUsers = false;

  constructor(private dialog: MatDialog, public authService: AuthService) {}

  ngOnInit(): void {
    const currentUserRole = this.authService.getUserRole();
    if (currentUserRole === 'headquarters') {
      this.onlyDisplayHeadquarters = true;
    } else if (currentUserRole === 'city') {
      this.onlyDisplayCityUsers = true;
    }
    this.getManagementBoard();
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

  async getManagementBoard(): Promise<void> {
    const firestore = getFirestore();
    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    let queryRef: Query<DocumentData>;

    if (currentUserRole === 'headquarters') {
      queryRef = collection(
        firestore,
        'managementBoards'
      ) as Query<DocumentData>;
      if (this.onlyDisplayHeadquarters) {
        queryRef = query(
          collection(firestore, 'managementBoards'),
          where('city', '==', null),
          where('district', '==', null)
        );
      }
    } else if (currentUserRole === 'city') {
      queryRef = query(
        collection(firestore, 'managementBoards'),
        where('city', '==', currentUserCity)
      );
      if (this.onlyDisplayCityUsers) {
        queryRef = query(
          collection(firestore, 'managementBoards'),
          where('city', '==', currentUserCity),
          where('district', '==', null)
        );
      }
    } else if (currentUserRole === 'district') {
      queryRef = query(
        collection(firestore, 'managementBoards'),
        where('district', '==', currentUserDistrict)
      );
    } else {
      throw new Error('Invalid user role');
    }

    const querySnapshot = await getDocs(queryRef);
    const managementMembers: ManagementBoardData[] = [];
    querySnapshot.forEach((doc) => {
      managementMembers.push({
        id: doc.id,
        ...doc.data(),
      } as ManagementBoardData);
    });

    this.dataSource = new MatTableDataSource(managementMembers);
  }

  onAddNewMember(): void {
    const dialogRef = this.dialog.open(ManagementBoardDialogComponent, {
      width: '500px',
      data: {
        member: { name: '', role: '', hubType: '', city: '', district: '' },
        readonly: false,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        delete result.id;
        await this.addMember(result);
      }
    });
  }

  async onEditMember(row: ManagementBoardData): Promise<void> {
    const dialogRef = this.dialog.open(ManagementBoardDialogComponent, {
      width: '500px',
      data: { member: row, readonly: false },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.updateCommitteeMember(result);
      }
    });
  }

  async addMember(data: ManagementBoardData): Promise<void> {
    const firestore = getFirestore();
    await addDoc(collection(firestore, 'managementBoards'), data);
    this.getManagementBoard();
  }

  async updateCommitteeMember(data: ManagementBoardData): Promise<void> {
    if (!data.id) {
      console.error('Error: Missing ID for the committee member.');
      return;
    }

    const firestore = getFirestore();
    const committeeMemberRef = doc(firestore, 'managementBoards', data.id);

    const { id, ...updateData } = data;

    try {
      await updateDoc(committeeMemberRef, updateData);
      this.getManagementBoard();
      console.log('Committee member updated successfully');
    } catch (error) {
      console.error('Error updating committee member:', error);
    }
  }

  async onDeleteMember(row: ManagementBoardData): Promise<void> {
    if (confirm('Bu kişiyi silmek istediğinize emin misiniz?')) {
      const firestore = getFirestore();
      const memberRef = doc(firestore, 'managementBoards', row.id!);
      await deleteDoc(memberRef);
      this.getManagementBoard();
    }
  }

  onCheckboxChange(): void {
    this.getManagementBoard();
  }
}
