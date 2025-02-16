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
import { ExecutiveCommitteeDialogComponent } from './executive-committee-dialog.component';
import { FormsModule } from '@angular/forms';

export interface ExecutiveCommitteeData {
  id?: string;
  name: string;
  role: string;
  hubType: string;
  city?: string;
  district?: string;
}

@Component({
    selector: 'app-executive-committee',
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
    templateUrl: './executive-committee.component.html',
    styleUrls: ['./executive-committee.component.scss']
})
export class ExecutiveCommitteeComponent implements OnInit {
  displayedColumns: string[] = ['name', 'role', 'city', 'district', 'actions'];
  dataSource = new MatTableDataSource<ExecutiveCommitteeData>();
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
    this.getExecutiveCommittee();
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

  async getExecutiveCommittee(): Promise<void> {
    const firestore = getFirestore();
    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    let queryRef: Query<DocumentData>;

    if (currentUserRole === 'headquarters') {
      queryRef = collection(
        firestore,
        'executiveCommittees'
      ) as Query<DocumentData>;
      if (this.onlyDisplayHeadquarters) {
        queryRef = query(
          collection(firestore, 'executiveCommittees'),
          where('city', '==', null),
          where('district', '==', null)
        );
      }
    } else if (currentUserRole === 'city') {
      queryRef = query(
        collection(firestore, 'executiveCommittees'),
        where('city', '==', currentUserCity)
      );
      if (this.onlyDisplayCityUsers) {
        queryRef = query(
          collection(firestore, 'executiveCommittees'),
          where('city', '==', currentUserCity),
          where('district', '==', null)
        );
      }
    } else if (currentUserRole === 'district') {
      queryRef = query(
        collection(firestore, 'executiveCommittees'),
        where('district', '==', currentUserDistrict)
      );
    } else {
      throw new Error('Invalid user role');
    }

    const querySnapshot = await getDocs(queryRef);
    const committeeMembers: ExecutiveCommitteeData[] = [];
    querySnapshot.forEach((doc) => {
      committeeMembers.push({
        id: doc.id,
        ...doc.data(),
      } as ExecutiveCommitteeData);
    });

    this.dataSource = new MatTableDataSource(committeeMembers);
  }

  onAddNewMember(): void {
    const dialogRef = this.dialog.open(ExecutiveCommitteeDialogComponent, {
      width: '500px',
      data: {
        member: { name: '', role: '', hubType: '', city: '', district: '' },
        readonly: false,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const { id, ...updateData } = result;
        await this.addMember(updateData);
      }
    });
  }

  async onEditMember(row: ExecutiveCommitteeData): Promise<void> {
    const dialogRef = this.dialog.open(ExecutiveCommitteeDialogComponent, {
      width: '500px',
      data: { member: row, readonly: false },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.updateCommitteeMember(result);
      }
    });
  }

  async addMember(data: ExecutiveCommitteeData): Promise<void> {
    const firestore = getFirestore();
    await addDoc(collection(firestore, 'executiveCommittees'), data);
    this.getExecutiveCommittee();
  }

  async updateCommitteeMember(data: ExecutiveCommitteeData): Promise<void> {
    if (!data.id) {
      console.error('Error: Missing ID for the committee member.');
      return;
    }

    const firestore = getFirestore();
    const committeeMemberRef = doc(firestore, 'executiveCommittees', data.id);

    const { id, ...updateData } = data;

    try {
      await updateDoc(committeeMemberRef, updateData);
      this.getExecutiveCommittee();
      console.log('Committee member updated successfully');
    } catch (error) {
      console.error('Error updating committee member:', error);
    }
  }

  async onDeleteMember(row: ExecutiveCommitteeData): Promise<void> {
    if (confirm('Bu kişiyi silmek istediğinize emin misiniz?')) {
      const firestore = getFirestore();
      const memberRef = doc(firestore, 'executiveCommittees', row.id!);
      await deleteDoc(memberRef);
      this.getExecutiveCommittee();
    }
  }

  onCheckboxChange(): void {
    this.getExecutiveCommittee();
  }
}
