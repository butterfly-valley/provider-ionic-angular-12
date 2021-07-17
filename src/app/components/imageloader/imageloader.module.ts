import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ImagePreloaderDirective} from '../../directives/ImagePlaceholder';



@NgModule({
  declarations: [ImagePreloaderDirective],
  imports: [
    CommonModule
  ],
  exports: [ImagePreloaderDirective]
})
export class ImageloaderModule { }
