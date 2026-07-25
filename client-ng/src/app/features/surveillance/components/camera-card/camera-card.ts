import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ZoomIn, ZoomOut, RotateCcw } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { CameraConfig } from '../../../../shared/constants/cameras/cameras.constants';

function buildStreamUrl(camera: CameraConfig): string {
  return `${environment.apiUrl}api/cameras/stream/${camera.id}`;
}

function clampOffset(x: number, y: number, zoom: number): { x: number; y: number } {
  const maxOffset = ((zoom - 1) / zoom) * 50;
  return {
    x: Math.max(-maxOffset, Math.min(maxOffset, x)),
    y: Math.max(-maxOffset, Math.min(maxOffset, y)),
  };
}

@Component({
  selector: 'app-camera-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './camera-card.html',
  styleUrl: './camera-card.scss',
})
export class CameraCard implements OnInit, AfterViewInit, OnDestroy {
  camera = input.required<CameraConfig>();
  showHeader = input(true);
  showFooter = input(true);
  fullHeight = input(false);
  @ViewChild('wrapper') wrapperEl?: ElementRef<HTMLDivElement>;

  streamUrl = signal('');
  zoom = signal(1);
  offset = signal({ x: 0, y: 0 });
  isDragging = signal(false);

  readonly zoomInIcon = ZoomIn;
  readonly zoomOutIcon = ZoomOut;
  readonly rotateCcwIcon = RotateCcw;

  private lastPos = { x: 0, y: 0 };
  private dragging = false;
  private wheelHandler?: (event: WheelEvent) => void;
  private touchStartDist = 0;
  private touchStartZoom = 1;
  private touchLastPos: { x: number; y: number } | null = null;

  ngOnInit(): void {
    this.streamUrl.set(buildStreamUrl(this.camera()));
  }

  ngAfterViewInit(): void {
    if (this.wrapperEl) {
      this.onWrapperInit(this.wrapperEl.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.wheelHandler && this.wrapperEl) {
      this.wrapperEl.nativeElement.removeEventListener('wheel', this.wheelHandler);
    }
  }

  private onWrapperInit(el: HTMLDivElement): void {
    this.wheelHandler = (event: WheelEvent) => {
      event.preventDefault();
      this.zoom.update((currentZoom) =>
        Math.max(1, Math.min(4, currentZoom - event.deltaY * 0.002)),
      );
      if (this.zoom() <= 1) this.offset.set({ x: 0, y: 0 });
    };
    el.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  onMouseDown(event: MouseEvent): void {
    if (this.zoom() <= 1) return;
    this.dragging = true;
    this.isDragging.set(true);
    this.lastPos = { x: event.clientX, y: event.clientY };
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.dragging || this.zoom() <= 1) return;
    const el = event.currentTarget as HTMLElement;
    const dx = ((event.clientX - this.lastPos.x) / el.offsetWidth) * 100;
    const dy = ((event.clientY - this.lastPos.y) / el.offsetHeight) * 100;
    this.lastPos = { x: event.clientX, y: event.clientY };
    this.offset.update((currentOffset) =>
      clampOffset(currentOffset.x + dx, currentOffset.y + dy, this.zoom()),
    );
  }

  onMouseUp(): void {
    this.dragging = false;
    this.isDragging.set(false);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.touchStartDist = Math.hypot(dx, dy);
      this.touchStartZoom = this.zoom();
    } else if (event.touches.length === 1) {
      this.touchLastPos = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      this.zoom.set(Math.max(1, Math.min(4, this.touchStartZoom * (dist / this.touchStartDist))));
    } else if (event.touches.length === 1 && this.touchLastPos && this.zoom() > 1) {
      const el = event.currentTarget as HTMLElement;
      const ddx = ((event.touches[0].clientX - this.touchLastPos.x) / el.offsetWidth) * 100;
      const ddy = ((event.touches[0].clientY - this.touchLastPos.y) / el.offsetHeight) * 100;
      this.touchLastPos = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      this.offset.update((currentOffset) =>
        clampOffset(currentOffset.x + ddx, currentOffset.y + ddy, this.zoom()),
      );
    }
  }

  onTouchEnd(): void {
    this.touchLastPos = null;
  }

  readonly transformStyle = computed(() => {
    const { x, y } = this.offset();
    return `scale(${this.zoom()}) translate(${x}%, ${y}%)`;
  });

  zoomInStep(): void {
    this.zoom.update((z) => Math.min(4, z + 0.5));
  }

  zoomOutStep(): void {
    this.zoom.update((z) => {
      const next = Math.max(1, z - 0.5);
      if (next <= 1) this.offset.set({ x: 0, y: 0 });
      return next;
    });
  }

  resetZoom(): void {
    this.zoom.set(1);
    this.offset.set({ x: 0, y: 0 });
  }
}
