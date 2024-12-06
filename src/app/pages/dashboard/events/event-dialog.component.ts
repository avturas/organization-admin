import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CITIES } from '../../../shared/cities';
import { AuthService } from '../../../auth.service';
import { DISTRICTS } from '../../../shared/districts';

export interface EventData {
  id?: string;
  owner: string;
  name: string;
  date: string;
  place: string;
  city: string;
  district: string;
  type: string;
  eventType: string;
  purpose: string;
  numberOfParticipants?: number;
  importantParticipants?: string;
  focusGroup?: string;
  budget?: string;
  expenses?: string;
  revenues?: string;
  notes?: string;
}

const EVENT_TYPE_OWNER_TEXT = {
  headquarters: 'Genel Merkez',
  city: 'İl',
  district: 'İlçe',
};

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './event-dialog.html',
  styleUrls: ['./event-dialog.scss'],
})
export class EventDialogComponent implements OnInit {
  eventForm!: FormGroup;
  EVENT_TYPE_OWNER_TEXT = EVENT_TYPE_OWNER_TEXT;
  readonlyMode: boolean;
  availableCities = Object.entries(CITIES).map(([key, value]) => ({
    key,
    value,
  }));
  filteredDistricts: string[] = [];
  availableEventTypes: string[] = [];
  showCityField = false;
  showDistrictField = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EventDialogComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA)
    public data: { event: EventData; readonly: boolean }
  ) {
    this.readonlyMode = data.readonly || false;
  }

  ngOnInit(): void {
    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (currentUserRole === 'headquarters') {
      this.availableEventTypes = ['headquarters', 'city', 'district'];
    } else if (currentUserRole === 'city') {
      this.availableEventTypes = ['city', 'district'];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
    } else if (currentUserRole === 'district') {
      this.availableEventTypes = ['district'];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
    }
    this.eventForm = this.fb.group({
      type: [this.data?.event?.type || '', Validators.required],
      city: [this.data?.event?.city || currentUserCity || ''],
      district: [this.data?.event?.district || currentUserDistrict || ''],
      owner: [this.data?.event?.owner || '', Validators.required],
      name: [this.data?.event?.name || '', Validators.required],
      date: [this.data?.event?.date || '', Validators.required],
      eventType: [this.data?.event?.eventType || '', Validators.required],
      place: [this.data?.event?.place || '', Validators.required],
      purpose: [this.data?.event?.purpose || '', Validators.required],
      numberOfParticipants: [this.data?.event?.numberOfParticipants || ''],
      importantParticipants: [this.data?.event?.importantParticipants || ''],
      focusGroup: [this.data?.event?.focusGroup || ''],
      budget: [this.data?.event?.budget || ''],
      expenses: [this.data?.event?.expenses || ''],
      revenues: [this.data?.event?.revenues || ''],
      notes: [this.data?.event?.notes || ''],
    });

    this.onTypeChange(this.eventForm.controls['type'].value);

    this.eventForm.controls['type'].valueChanges.subscribe((type) => {
      this.onTypeChange(type);
    });

    if (this.readonlyMode) {
      this.eventForm.disable();
    }
  }

  getRoleText = (role: string) => {
    return (
      EVENT_TYPE_OWNER_TEXT[role as keyof typeof EVENT_TYPE_OWNER_TEXT] ||
      'Bilinmeyen Rol'
    );
  };

  onTypeChange(selectedType: string): void {
    this.showCityField = selectedType === 'city' || selectedType === 'district';
    this.showDistrictField = selectedType === 'district';

    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (!this.showCityField) {
      this.eventForm.controls['city'].reset();
    }
    if (!this.showDistrictField) {
      this.eventForm.controls['district'].reset();
    }

    if (currentUserRole === 'district' && selectedType === 'district') {
      this.eventForm.controls['city'].setValue(currentUserCity);
      this.eventForm.controls['district'].setValue(currentUserDistrict);
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
    } else if (this.showCityField && this.eventForm.controls['city'].value) {
      this.onCityChange(this.eventForm.controls['city'].value);
    }
  }

  onCityChange(selectedCity: string): void {
    const currentUserRole = this.authService.getUserRole();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (currentUserRole === 'district') {
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
      this.eventForm.controls['district'].setValue(currentUserDistrict);
      return;
    }

    const cityName = this.availableCities.find(
      (city) => city.value === selectedCity
    )?.value;

    this.filteredDistricts = cityName ? DISTRICTS[cityName] || [] : [];
    this.eventForm.controls['district'].reset();
  }

  onSubmit(): void {
    if (this.eventForm.valid && !this.readonlyMode) {
      const formValue = this.eventForm.value;

      if (formValue.date) {
        formValue.date = new Date(formValue.date).toISOString();
      }

      this.dialogRef.close(formValue);
      this.dialogRef.close(this.eventForm.value);
    }
  }
}
