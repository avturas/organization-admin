import { Component } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(app: FirebaseApp) {}
  title = 'Organizasyon Admin';
}
