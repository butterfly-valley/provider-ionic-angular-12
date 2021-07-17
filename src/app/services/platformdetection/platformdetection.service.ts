import { Injectable } from '@angular/core';
import {Platform} from '@ionic/angular';
import {DeviceDetectorService} from 'ngx-device-detector';

@Injectable({
  providedIn: 'root'
})
export class PlatformDetectionService {

  constructor(private platform: Platform,
              private deviceService: DeviceDetectorService) { }

  mobile = false;
  tablet = false;

  getCurrentPlatforms() {
    return this.platform.platforms();
  }

  isTablet(): boolean {
    this.platform.platforms().forEach(platform => {
      if (platform === 'tablet') {
        this.tablet = true;
      }
    });
    return this.tablet;
  }
  /*Returns true if viewed on mobile device*/
  isMobile(): boolean {
    this.platform.platforms().forEach(platform => {
      if (platform === 'mobileweb') {
        this.mobile = true;
      }
    });
    return this.mobile;
  }

  returnDeviceInfo() {
    return {
      browser: this.deviceService.browser,
      browser_version: this.deviceService.browser_version,
      os: this.deviceService.os,
      os_version: this.deviceService.os_version,
      userAgent: this.deviceService.userAgent
    };

  }
}
