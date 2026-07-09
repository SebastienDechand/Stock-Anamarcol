import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Video } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { CameraCard } from './components/camera-card/camera-card';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { CAMERAS_CONFIG, CameraConfig } from '../../shared/constants/cameras.constants';

@Component({
  selector: 'app-surveillance-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe, CameraCard, PageHero],
  templateUrl: './surveillance-page.html',
  styleUrl: './surveillance-page.scss',
})
export class SurveillancePage implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly cameras = CAMERAS_CONFIG;
  readonly video = Video;

  /** Mode flux seul — ?flux=camera_id : affichage plein écran d'une seule caméra, sans chrome. */
  fluxCamera = signal<CameraConfig | null | undefined>(undefined);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const fluxId = params.get('flux');
      if (!fluxId) {
        this.fluxCamera.set(undefined);
        return;
      }
      this.fluxCamera.set(this.cameras.find((camera) => camera.id === fluxId) ?? null);
    });
  }
}
