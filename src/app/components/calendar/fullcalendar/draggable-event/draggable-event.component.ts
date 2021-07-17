import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Draggable} from '@fullcalendar/interaction';

@Component({
  selector: 'app-draggable-event',
  templateUrl: './draggable-event.component.html',
  styleUrls: ['./draggable-event.component.scss'],
})
export class DraggableEventComponent implements OnInit, AfterViewInit {

  @ViewChild('draggable', {static: false}) draggable: any;
  @ViewChild('external', {static: false}) external: ElementRef;

  constructor() { }

  ngOnInit() {
    // tslint:disable-next-line:no-unused-expression
    new Draggable(this.external.nativeElement, {
      itemSelector: '.fc-daygrid-event',
      eventData(eventEl) {
        return {
          title: eventEl.innerText
        };
      }
    });
  }

  ngAfterViewInit() {
    // console.log('PEOPLE LIST ngAfterViewInit() START !!!')
    // const self = this;
    //
    // // tslint:disable-next-line:no-unused-expression
    // new Draggable(this.draggable.nativeElement, {
    //   itemSelector: '.fc-event',
    //   eventData(eventEl) {
    //     console.log("DRAG !!!");
    //     console.log("SELECTED SHIFT: ");
    //
    //     // const returnedEvent = self.createEventObject(self.selectedShift.value, eventEl.innerText);
    //
    //     // return returnedEvent;
    //
    //     return {
    //       title: 'lçkasjfçlasjdf',
    //       startTime: '18:00',
    //       duration: {
    //         minutes: 8
    //       }
    //     };
    //   }
    // });

  }

}
