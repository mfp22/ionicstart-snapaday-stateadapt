import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  NgModule,
} from '@angular/core';
import {
  IonicModule,
  ModalController,
  RangeCustomEvent,
  ToggleCustomEvent,
} from '@ionic/angular';
import { adapt, watch } from '@state-adapt/angular';
import { createAdapter, joinAdapters, mapPayloads } from '@state-adapt/core';
import { booleanAdapter, numberAdapter } from '@state-adapt/core/adapters';
import { toSource } from '@state-adapt/rxjs';
import { BehaviorSubject, interval, NEVER } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Photo } from '../shared/interfaces/photo';
import { SlideshowImageComponentModule } from './ui/slideshow-image.component';

@Component({
  selector: 'app-slideshow',
  template: `
    <ion-header>
      <ion-toolbar
        *ngIf="{ paused: slideshow.paused$ | async } as pause"
        [color]="pause.paused ? 'success' : 'danger'"
      >
        <ion-title>{{
          pause.paused ? 'Look at this gorgeous specimen' : 'Play'
        }}</ion-title>
        <ion-buttons slot="end">
          <ion-button
            data-test="slideshow-close-button"
            (click)="modalCtrl.dismiss()"
          >
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ng-container *ngIf="slideshow.currentPhoto$ | async as photo">
        <!-- Each event in template calls only 1 function with minimal data -->
        <app-slideshow-image
          (mousedown)="slideshow.setPausedTrue()"
          (mouseup)="slideshow.setPausedFalse()"
          [safeResourceUrl]="photo.safeResourceUrl"
        ></app-slideshow-image>
        <ion-card>
          <ion-card-content>
            <ion-button (click)="slideshow.move(-1)">Prev</ion-button>
            <ion-button (click)="slideshow.move(1)">Next</ion-button>
            <h2>Speed</h2>
            <ion-range
              (ionChange)="slideshow.setDelayTime($event)"
              min="50"
              max="1000"
              [value]="slideshow.delayTime$ | async"
            ></ion-range>
            <h2>Loop</h2>
            <ion-toggle
              [checked]="slideshow.loop$ | async"
              (ionChange)="slideshow.toggleLoop($event)"
            ></ion-toggle>
          </ion-card-content>
        </ion-card>
      </ng-container>
    </ion-content>
  `,
  styles: [
    `
      :host {
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideshowComponent {
  photosInput$ = new BehaviorSubject<Photo[]>([]);
  photosReceived$ = this.photosInput$.pipe(toSource('photosReceived$'));

  photoAdapter = createAdapter<Photo | null>()({
    setNull: () => null,
  });

  slideshowAdapter = joinAdapters<{
    currentPhotos: Photo[];
    currentPhoto: Photo | null;
    paused: boolean;
    loop: boolean;
    delayTime: number;
  }>()({
    // Define adapters that will manage each property
    currentPhotos: createAdapter<Photo[]>()({}),
    currentPhoto: this.photoAdapter,
    paused: booleanAdapter,
    loop: booleanAdapter,
    delayTime: numberAdapter,
  })({
    // Objects define new memoized selectors
    currentIndex: (s) => s.currentPhotos.indexOf(s.currentPhoto as Photo),
    photoCount: (s) => s.currentPhotos.length,
  })({
    isLastPhoto: (s) => s.currentIndex === s.photoCount - 1,
  })({
    tickDelay: (s) =>
      s.paused || (!s.loop && s.isLastPhoto) ? Infinity : s.delayTime,
  })(([selectors]) => ({
    // Functions define new reactions
    move: (state, amount: number) => {
      const photoCount = selectors.photoCount(state);
      const newIndex =
        (selectors.currentIndex(state) + amount + photoCount) % photoCount;
      return {
        ...state,
        paused: true,
        currentPhoto: state.currentPhotos[newIndex],
      };
    },
  }))(([, reactions]) => ({
    nextWithoutPause: (state) => ({
      ...reactions.move(state, 1),
      paused: false,
    }),
    // Changes existing state reactions to accept different payloads
    ...mapPayloads(reactions, {
      setDelayTime: (ev: Event) =>
        (ev as RangeCustomEvent).detail.value as number,
      toggleLoop: (ev: Event) => (ev as ToggleCustomEvent).detail.checked,
    }),
  }))();

  initialState = {
    currentPhotos: [] as Photo[],
    loop: true,
    delayTime: 1000,
    paused: false,
    currentPhoto: null as Photo | null,
  };

  // `watch` is for circular RxJS references. Path must be same as store path.
  tick$ = watch('slideshow', this.slideshowAdapter).tickDelay$.pipe(
    switchMap((t) => (t === Infinity ? NEVER : interval(t))),
    toSource('tick$')
  );

  // Initializes state, subscribes to sources
  slideshow = adapt(['slideshow', this.initialState, this.slideshowAdapter], {
    nextWithoutPause: this.tick$,
    setCurrentPhotos: this.photosReceived$,
  });

  constructor(protected modalCtrl: ModalController) {}

  @Input() set photos(value: Photo[]) {
    this.photosInput$.next([...value].reverse());
  }
}

@NgModule({
  declarations: [SlideshowComponent],
  imports: [IonicModule, CommonModule, SlideshowImageComponentModule],
  exports: [SlideshowComponent],
})
export class SlideshowComponentModule {}
