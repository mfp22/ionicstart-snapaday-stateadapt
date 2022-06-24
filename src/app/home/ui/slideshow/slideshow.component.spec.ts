import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { Photo } from '../../../shared/interfaces/photo';
import { SlideshowComponent } from './slideshow.component';

describe('SlideshowComponent', () => {
  let component: SlideshowComponent;
  let fixture: ComponentFixture<SlideshowComponent>;
  let testPhotos: Photo[];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SlideshowComponent],
      imports: [IonicModule.forRoot()],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(SlideshowComponent);
    component = fixture.componentInstance;

    testPhotos = [
      { safeResourceUrl: 'path1' },
      { safeResourceUrl: 'path2' },
      { safeResourceUrl: 'path3' },
    ] as any;

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('@Input() photos', () => {
    it('should display the oldest photo in an image tag', () => {
      const img = fixture.debugElement.query(
        By.css('[data-test="slideshow-image"]')
      );

      expect(img.attributes.src).toEqual(
        testPhotos[testPhotos.length - 1].safeResourceUrl
      );
    });

    it('when the play button is clicked, it should show every photo in sequence', fakeAsync(() => {
      const img = fixture.debugElement.query(
        By.css('[data-test="slideshow-image"]')
      );

      jest.spyOn(img.nativeElement, 'src', 'set');

      const playButton = fixture.debugElement.query(
        By.css('[data-test="play-button"]')
      );

      playButton.nativeElement.click();

      expect(img.nativeElement.src.set).toHaveBeenCalledWith(
        testPhotos[testPhotos.length - 2].safeResourceUrl
      );

      tick(500);

      expect(img.nativeElement.src.set).toHaveBeenCalledWith(
        testPhotos[testPhotos.length - 3].safeResourceUrl
      );
    }));
  });
});
