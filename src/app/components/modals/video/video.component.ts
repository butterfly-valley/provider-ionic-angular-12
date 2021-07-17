import {Component, Input, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {mobile, tablet} from "../../../app.component";
import {ModalService} from "../../../services/overlay/modal.service";

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
})
export class VideoComponent implements OnInit {

  mobile = mobile;
  tablet = tablet;

  @Input() link;
  videoLink: {
    trustedVideoUrl: SafeResourceUrl,
    link: string
  } = {
    trustedVideoUrl: undefined,
    link: ''
  }

  constructor(private domSanitizer: DomSanitizer,
              private modalService: ModalService) { }

  ngOnInit() {
    this.videoLink.link = this.link;
    this.videoLink.trustedVideoUrl= this.domSanitizer.bypassSecurityTrustResourceUrl(this.link);
  }

  async dismiss() {
    await this.modalService.dismissVideoModal();
  }
}
