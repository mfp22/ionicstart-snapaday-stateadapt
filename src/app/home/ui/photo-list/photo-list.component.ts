import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  NgModule,
  Output,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Photo } from '../../../shared/interfaces/photo';

@Component({
  selector: 'app-photo-list',
  template: `
    <ion-list data-test="photo-list">
      <ion-item *ngFor="let photo of photos" data-test="photo">
        <img [src]="photo.safeResourceUrl" />
      </ion-item>
    </ion-list>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoListComponent {
  @Input() photos!: Photo[] | null;
  @Output() delete = new EventEmitter<string>();

  constructor() {}
}

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [PhotoListComponent],
  exports: [PhotoListComponent],
})
export class PhotoListComponentModule {}
