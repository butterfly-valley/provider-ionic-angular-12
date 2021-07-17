import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PagePage } from './page.page';
import {MatCardModule} from "@angular/material/card";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {TranslateModule} from "@ngx-translate/core";
import {ImageloaderModule} from "../../../components/imageloader/imageloader.module";
import {ComponentsModule} from "../../../components/components/components.module";

const routes: Routes = [
  {
    path: '',
    component: PagePage
  }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        MatCardModule,
        FontAwesomeModule,
        TranslateModule.forChild(),
        ImageloaderModule,
        ComponentsModule
    ],
  declarations: [PagePage]
})
export class PagePageModule {}
