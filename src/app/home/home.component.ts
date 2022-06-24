import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgModule } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { PhotoService } from './data-access/photo/photo.service';
import { PhotoListComponentModule } from './ui/photo-list/photo-list.component';
import { SlideshowComponentModule } from './ui/slideshow/slideshow.component';

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar color="danger">
        <ion-title>Snapaday</ion-title>
        <ion-buttons slot="end">
          <ion-button
            [disabled]="(photoService.canTakePhoto() | async) === false"
            (click)="photoService.takePhoto()"
            data-test="take-photo-button"
          >
            <ion-icon name="camera-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button
            data-test="slideshow-button"
            (click)="modalIsOpen$.next(true)"
          >
            <ion-icon name="play" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <app-photo-list
        [photos]="photos$ | async"
        (delete)="photoService.deletePhoto($event)"
      ></app-photo-list>
    </ion-content>
    <ion-modal
      [isOpen]="modalIsOpen$"
      (ionModalDidDismiss)="modalIsOpen$.next(false)"
    >
      <ng-template>
        <app-slideshow></app-slideshow>
      </ng-template>
    </ion-modal>
  `,
  styles: [
    `
      ion-title img {
        max-height: 30px;
        margin-top: 4px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  photos$ = this.photoService.getPhotos().pipe(
    map((photos) =>
      photos.map((photo) => ({
        ...photo,
        safeResourceUrl: this.sanitizer.bypassSecurityTrustResourceUrl(
          photo.path
        ),
      }))
    )
  );

  modalIsOpen$ = new BehaviorSubject(false);

  constructor(
    protected photoService: PhotoService,
    private sanitizer: DomSanitizer
  ) {}
}

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PhotoListComponentModule,
    SlideshowComponentModule,
    RouterModule.forChild([
      {
        path: '',
        component: HomeComponent,
      },
    ]),
  ],
  declarations: [HomeComponent],
})
export class HomeModule {}
