import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebcamComponent } from './components/webcam/webcam.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';

const routes: Routes = [
  // { path: '', redirectTo: 'webcam', pathMatch: 'full' },
  { path: '', component: WebcamComponent },
  { path: 'upload', component: ImageUploadComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
