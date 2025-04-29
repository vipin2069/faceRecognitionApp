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

  faceInfos: { age: number; gender: string; emotion: string }[] = [];



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
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models/tiny_face_detector'),
      faceapi.nets.ageGenderNet.loadFromUri('/assets/models/age_gender_model'),
      faceapi.nets.faceExpressionNet.loadFromUri('/assets/models/face_expression')
    ]);
  }

  async startCamera() {
    if (this.isBrowser) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoRef.nativeElement.srcObject = this.stream;

      this.videoRef.nativeElement.addEventListener('play', () => {
        const video = this.videoRef.nativeElement;
        const canvas = this.canvasRef.nativeElement;

        video.width = video.videoWidth;
        video.height = video.videoHeight;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        this.detectInterval = setInterval(async () => {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withAgeAndGender()
            .withFaceExpressions();

          const resized = faceapi.resizeResults(detections, displaySize);
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);

          // Draw bounding boxes
          faceapi.draw.drawDetections(canvas, resized);

          // Draw face expressions as icons
          // faceapi.draw.drawFaceExpressions(canvas, resized);

          // Draw custom labels: Age, Gender, Emotion
          ctx!.font = '14px Arial';
          ctx!.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx!.strokeStyle = '#fff';
          ctx!.lineWidth = 2;

          resized.forEach(result => {
            const { age, gender, expressions, detection } = result;
            const topLeft = detection.box.topLeft;

            const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
            const emotion = sorted.length ? sorted[0][0] : 'Neutral';
            const text = `Age: ${Math.round(age)}, Gender: ${gender}, Emotion: ${emotion}`;

            if (ctx && topLeft) {
              const [x, y] = [topLeft.x, topLeft.y - 10];
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(x, y - 16, ctx.measureText(text).width + 10, 20);
              ctx.fillStyle = '#fff';
              ctx.fillText(text, x + 5, y);
            }
          });

          // Optional: Update faceInfos if needed elsewhere
          this.faceInfos = resized.map(result => {
            const sorted = Object.entries(result.expressions).sort((a, b) => b[1] - a[1]);
            return {
              age: result.age,
              gender: result.gender,
              emotion: sorted.length ? sorted[0][0] : 'Neutral'
            };
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
  async captureImage() {
    const video = this.videoRef.nativeElement;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video not ready yet");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context?.drawImage(video, 0, 0);

    this.capturedImage = canvas.toDataURL('image/png');

    // Process captured image
    const img = await faceapi.fetchImage(this.capturedImage);
    const displayCanvas = this.canvasRef.nativeElement;
    const displaySize = { width: img.width, height: img.height };
    faceapi.matchDimensions(displayCanvas, displaySize);

    const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
      .withAgeAndGender()
      .withFaceExpressions();

    const overlayCanvas = this.canvasRef.nativeElement;
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    const resized = faceapi.resizeResults(detections, displaySize);
    const overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    faceapi.draw.drawDetections(overlayCanvas, resized);
    faceapi.draw.drawFaceExpressions(overlayCanvas, resized);

    this.faceInfos = resized.map(det => {
      const sorted = Object.entries(det.expressions).sort((a, b) => b[1] - a[1]);
      return {
        age: det.age,
        gender: det.gender,
        emotion: sorted.length ? sorted[0][0] : 'Neutral'
      };
    });

  }
}
