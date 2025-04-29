import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as faceapi from 'face-api.js';
@Component({
  selector: 'app-webcam',
  standalone: true,
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.css'],
  imports: [CommonModule]
})

export class WebcamComponent implements OnInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlay') canvasRef!: ElementRef<HTMLCanvasElement>;

  stream: MediaStream | null = null;
  isBrowser: boolean;
  detectInterval: any;
  capturedImage: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    if (this.isBrowser) {
      await this.loadModels();
    }
  }
  ngOnDestroy() {
    this.stopCamera(); // Clean up when component destroyed
  }

  async loadModels() {
    const MODEL_URL = '/assets/models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);
  }

  async startCamera() {
    if (this.isBrowser) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoRef.nativeElement.srcObject = this.stream;

      this.videoRef.nativeElement.addEventListener('play', () => {
        const video = this.videoRef.nativeElement;
        const canvas = this.canvasRef.nativeElement;
        const displaySize = { width: video.width, height: video.height };

        faceapi.matchDimensions(canvas, displaySize);

        this.detectInterval = setInterval(async () => {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withAgeAndGender()
            .withFaceExpressions();

          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);


          faceapi.draw.drawDetections(canvas, resizedDetections);

          // faceapi.draw.drawFaceExpressions(canvas, resized);

          resizedDetections.forEach(det => {
            const { age, gender, expressions } = det;
            const { x, y } = det.detection.box;

            ctx!.fillStyle = '#ff4757';
            ctx!.font = '16px Arial';
            ctx!.fillText(`Age: ${age.toFixed(0)}, Gender: ${gender}`, x, y - 10);

            const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
            if (sorted.length) {
              ctx!.fillText(`Emotion: ${sorted[0][0]}`, x, y - 30);
            }
          });
        }, 500);
      });
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.detectInterval) {
      clearInterval(this.detectInterval);
    }
  }
  captureImage() {
    if (!this.videoRef) return;

    const canvas = document.createElement('canvas');
    const video = this.videoRef.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedImage = canvas.toDataURL('image/png');
    }
  }
}
