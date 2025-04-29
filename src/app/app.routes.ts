import { Routes } from '@angular/router';
import { WebcamComponent } from './components/webcam/webcam.component';


export const routes: Routes = [
    { path: '', redirectTo: 'webcam', pathMatch: 'full' },
    { path: 'webcam', component: WebcamComponent },
    // { path: 'upload', component: UploadComponent }
];
