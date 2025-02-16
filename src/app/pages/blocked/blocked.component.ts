import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';

@Component({
    selector: 'app-blocked',
    template: `
    <div class="blocked">
      <h2>Telefon numaranız onaylanmadı!</h2>
      <p>Lütfen sistem yöneticiniz ile iletişime geçin.</p>
      <button mat-button (click)="logOut()">Çıkış Yap</button>
    </div>
  `,
    styles: [
        `
      .blocked {
        text-align: center;
        margin: 50px;
      }
    `,
    ],
    standalone: false
})
export class BlockedComponent {
  constructor(private authService: AuthService) {}

  logOut() {
    this.authService.logout();
  }
}
