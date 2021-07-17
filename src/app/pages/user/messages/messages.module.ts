import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MessagesPage } from './messages.page';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {ImageloaderModule} from '../../../components/imageloader/imageloader.module';
import {TranslateModule} from '@ngx-translate/core';
import {MatCardModule} from "@angular/material/card";
import {ComponentsModule} from "../../../components/components/components.module";

const routes: Routes = [
  {
    path: '',
    component: MessagesPage
  }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        FontAwesomeModule,
        ImageloaderModule,
        TranslateModule.forChild(),
        MatCardModule,
        ComponentsModule
    ],
  declarations: [MessagesPage]
})
export class MessagesPageModule {}
