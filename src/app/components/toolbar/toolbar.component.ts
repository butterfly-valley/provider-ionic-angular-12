import {Component, Input, OnInit} from '@angular/core';
import {LocalizationService} from '../../services/localization/localization.service';
import {PlatformDetectionService} from '../../services/platformdetection/platformdetection.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  mobile = false;

  @Input() displayBackButton = false;


  constructor(private localizationService: LocalizationService,
              private platformService: PlatformDetectionService

  )  {
    if (platformService.isMobile()) {
      this.mobile = true;
    }
  }

  ngOnInit() {}


}
