import {Component, Input, OnInit} from '@angular/core';
import {mobile, tablet} from "../../../app.component";
import {ModalService} from "../../../services/overlay/modal.service";

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
})
export class ImageComponent {
  @Input() image: string;
  mobile = mobile;
  tablet = tablet;

  constructor(private modalService: ModalService) { }



  async dismiss() {
    await  this.modalService.dismissImageModal();
  }
}
