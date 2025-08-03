import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  addDoc,
  deleteDoc,
  query,
  where,
  Query,
  DocumentData,
} from '@angular/fire/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { CITIES } from '../../shared/cities';
import { DISTRICTS } from '../../shared/districts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatPaginatorModule,
  ],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
})
export class DocumentsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  documents: DocumentData[] = [];
  dataSource = new MatTableDataSource<DocumentData>();

  uploadForm!: FormGroup;
  showCityField = false;
  showDistrictField = false;

  availableAudienceTypes: { value: string; label: string }[] = [];
  availableCities = Object.entries(CITIES).map(([key, value]) => ({
    key,
    value,
  }));
  filteredDistricts: string[] = [];

  currentUserRole = '';
  currentUserCity = '';
  currentUserDistrict = '';

  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUserRole = this.authService.getUserRole() || '';
    this.currentUserCity = this.authService.getUserCity() || '';
    this.currentUserDistrict = this.authService.getUserDistrict() || '';

    if (this.currentUserRole === 'headquarters') {
      this.availableAudienceTypes = [
        { value: 'everyone', label: 'Herkes' },
        { value: 'headquarters', label: 'Genel Merkez' },
        { value: 'city', label: 'Şehir' },
        { value: 'district', label: 'İlçe' },
      ];
    } else if (this.currentUserRole === 'city') {
      this.availableAudienceTypes = [
        { value: 'city', label: 'Şehir' },
        { value: 'district', label: 'İlçe' },
      ];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === this.currentUserCity
      );
    } else if (this.currentUserRole === 'district') {
      this.availableAudienceTypes = [{ value: 'district', label: 'İlçe' }];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === this.currentUserCity
      );
      this.filteredDistricts = this.currentUserDistrict
        ? [this.currentUserDistrict]
        : [];
    }

    this.uploadForm = this.fb.group({
      audienceType: ['', Validators.required],
      city: [this.currentUserCity],
      district: [this.currentUserDistrict],
    });

    this.onAudienceTypeChange(this.uploadForm.controls['audienceType'].value);

    this.uploadForm.controls['audienceType'].valueChanges.subscribe((type) =>
      this.onAudienceTypeChange(type)
    );

    this.loadDocuments();
  }

  onAudienceTypeChange(type: string): void {
    this.showCityField = type === 'city' || type === 'district';
    this.showDistrictField = type === 'district';

    if (!this.showCityField) this.uploadForm.controls['city'].reset();
    if (!this.showDistrictField) this.uploadForm.controls['district'].reset();
  }

  onCityChange(selectedCity: string): void {
    if (this.currentUserRole === 'district') {
      this.filteredDistricts = this.currentUserDistrict
        ? [this.currentUserDistrict]
        : [];
      this.uploadForm.controls['district'].setValue(this.currentUserDistrict);
      return;
    }

    const cityName = this.availableCities.find(
      (city) => city.value === selectedCity
    )?.value;

    this.filteredDistricts = cityName ? DISTRICTS[cityName] || [] : [];
    this.uploadForm.controls['district'].reset();
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
    if (!this.selectedFile || this.uploadForm.invalid) return;

    const { audienceType, city, district } = this.uploadForm.value;

    const firestore = getFirestore();
    const storage = getStorage();

    const filePath = `documents/${Date.now()}_${this.selectedFile.name}`;
    const fileRef = ref(storage, filePath);

    const metadata = {
      customMetadata: {
        audienceType,
        city: city || '',
        district: district || '',
      },
    };

    try {
      const uploadTask = uploadBytesResumable(
        fileRef,
        this.selectedFile,
        metadata
      );

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            await addDoc(collection(firestore, 'documents'), {
              fileName: this.selectedFile?.name,
              filePath,
              uploadedBy: this.currentUserRole,
              uploadDate: new Date().toISOString(),
              audienceType,
              city: city || null,
              district: district || null,
            });

            this.selectedFile = null;
            this.uploadForm.reset();
            this.loadDocuments();

            resolve();
          }
        );
      });
    } catch (error) {
      console.error('Unexpected upload failure:', error);
    }
  }

  async loadDocuments(): Promise<void> {
    const firestore = getFirestore();
    const documents: DocumentData[] = [];

    const role = this.authService.getUserRole();
    const city = this.authService.getUserCity();
    const district = this.authService.getUserDistrict();

    if (!role) {
      console.warn('No role found in user claims.');
      return;
    }

    const baseRef = collection(firestore, 'documents');
    const queries: Query<DocumentData>[] = [];

    queries.push(query(baseRef, where('audienceType', '==', 'everyone')));

    if (role === 'headquarters') {
      queries.push(query(baseRef, where('audienceType', '==', 'headquarters')));
      queries.push(query(baseRef, where('audienceType', '==', 'city')));
      queries.push(query(baseRef, where('audienceType', '==', 'district')));
    }

    if (role === 'city' && city) {
      queries.push(
        query(
          baseRef,
          where('audienceType', '==', 'city'),
          where('city', '==', city)
        )
      );
      queries.push(
        query(
          baseRef,
          where('audienceType', '==', 'district'),
          where('city', '==', city)
        )
      );
    }

    if (role === 'district' && city && district) {
      queries.push(
        query(
          baseRef,
          where('audienceType', '==', 'district'),
          where('city', '==', city),
          where('district', '==', district)
        )
      );
    }

    const snapshots = await Promise.all(queries.map((q) => getDocs(q)));

    const seen = new Set<string>();
    for (const snap of snapshots) {
      snap.forEach((doc) => {
        if (!seen.has(doc.id)) {
          documents.push({ id: doc.id, ...doc.data() } as DocumentData);
          seen.add(doc.id);
        }
      });
    }

    this.dataSource = new MatTableDataSource(documents);
  }

  async deleteFile(documentId: string, filePath: string): Promise<void> {
    if (confirm('Are you sure you want to delete this document?')) {
      const firestore = getFirestore();
      const storage = getStorage();
      try {
        await deleteObject(ref(storage, filePath));
        await deleteDoc(doc(firestore, 'documents', documentId));
        this.loadDocuments();
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  }

  async downloadFile(filePath: string): Promise<void> {
    const storage = getStorage();
    try {
      const downloadURL = await getDownloadURL(ref(storage, filePath));
      window.open(downloadURL, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }
}
