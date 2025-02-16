import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-delete-confirmation-dialog',
    imports: [MatDialogModule, MatButtonModule, CommonModule],
    template: `
    <h1 mat-dialog-title>Kullanıcı Sil</h1>
    <div mat-dialog-content>
      <p>Bu kullanıcıyı silmek istediğinizden emin misiniz?</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onCancel()">İptal</button>
      <button mat-button color="warn" (click)="onConfirm()">Sil</button>
    </div>
  `
})
export class DeleteConfirmationDialog {
  constructor(public dialogRef: MatDialogRef<DeleteConfirmationDialog>) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
