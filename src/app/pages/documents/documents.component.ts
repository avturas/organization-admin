import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  collection,
  getFirestore,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from '@angular/fire/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

interface DocumentData {
  id: string;
  fileName: string;
  filePath: string;
  uploadedBy: string;
  uploadDate: string;
}

@Component({
    selector: 'app-documents',
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
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;
  displayedColumns: string[] = [
    'fileName',
    'uploadedBy',
    'uploadDate',
    'actions',
  ];
  dataSource = new MatTableDataSource<DocumentData>();
  selectedFile: File | null = null;
  isHeadquartersUser: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isHeadquartersUser = this.authService.getUserRole() === 'headquarters';
    this.loadDocuments();
  }

  async loadDocuments(): Promise<void> {
    const firestore = getFirestore();
    const docsRef = collection(firestore, 'documents');
    const snapshot = await getDocs(docsRef);
    const documents: DocumentData[] = [];
    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      } as DocumentData);
    });
    this.dataSource.data = documents;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile) return;

    const storage = getStorage();
    const filePath = `documents/${Date.now()}_${this.selectedFile.name}`;
    const fileRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(fileRef, this.selectedFile);

    uploadTask.on(
      'state_changed',
      null,
      (error) => console.error('File upload error:', error),
      async () => {
        const firestore = getFirestore();
        const metadata = {
          fileName: this.selectedFile?.name,
          filePath,
          uploadedBy: this.authService.getUserRole(),
          uploadDate: new Date().toISOString(),
        };

        await addDoc(collection(firestore, 'documents'), metadata);
        this.selectedFile = null;
        this.loadDocuments();
      }
    );
  }

  async deleteFile(documentId: string, filePath: string): Promise<void> {
    if (confirm('Bu belgeyi silmek istediğinize emin misiniz?')) {
      const storage = getStorage();
      const firestore = getFirestore();

      try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);

        const docRef = doc(firestore, 'documents', documentId);
        await deleteDoc(docRef);

        this.loadDocuments();
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  }

  async downloadFile(filePath: string): Promise<void> {
    const storage = getStorage();
    const fileRef = ref(storage, filePath);

    try {
      const downloadURL = await getDownloadURL(fileRef);
      window.open(downloadURL, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }
}
