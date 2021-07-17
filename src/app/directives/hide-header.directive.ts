import {AfterViewInit, Directive, HostListener, Input, OnInit, Renderer2} from '@angular/core';
import {DomController} from '@ionic/angular';
import {isIos} from '../app.component';

@Directive({
  selector: '[appHideHeader]',
})
export class HideHeaderDirective implements AfterViewInit {
  @Input('appHideHeader') header: any;
  @Input('appStickyCalendarHeader') calendarHeader: any;
  private headerHeight = isIos ? 44 : 56;
  private children: any;

  constructor(private renderer: Renderer2, private domCtrl: DomController) { }


  ngAfterViewInit() {
    setTimeout(() => {
      this.calendarHeader = this.calendarHeader.el;

      if (this.header) {
        this.header = this.header.el;
        this.children = this.header.children;
      }
    }, 100);
  }



  @HostListener('ionScroll', ['$event'])
  onContentScroll($event: any) {
    const scrollTop: number = $event.detail.scrollTop;
    let newPosition = -scrollTop;

    if (newPosition < -this.headerHeight) {
      newPosition = -this.headerHeight;
    }
    const newOpacity = 1 - (newPosition / -this.headerHeight);


    this.domCtrl.write(() => {
      if (this.header) {
        this.renderer.setStyle(this.header, 'top', newPosition + 'px');
      }
      this.renderer.setStyle(this.calendarHeader, 'position', newPosition + 66 < 11 ? 'fixed' : 'relative');
      this.renderer.setStyle(this.calendarHeader, 'max-width', newPosition + 66 < 11 ? '1200px' : 'auto');
      this.renderer.setStyle(this.calendarHeader, 'top', newPosition + 66 < 11 ? newPosition + 100 + 'px' : '0');
      this.renderer.setStyle(this.calendarHeader, 'z-index', '2');

      if (this.children) {
        for (const c of this.children) {
          this.renderer.setStyle(c, 'opacity', newOpacity);
        }
      }
    });
  }
}
