import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcamComponent } from './components/webcam/webcam.component';

@Component({
  selector: 'app-root',
  standalone: true,   // ✅ Very important
  imports: [CommonModule, WebcamComponent],  // ✅ Import other standalone components
  templateUrl: './app.component.html',
  // styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'face-recognition-app';
}
