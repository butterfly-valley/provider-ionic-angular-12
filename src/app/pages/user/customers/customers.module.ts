import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CustomersPage } from './customers.page';
import {MatCardModule} from "@angular/material/card";
import {ImageloaderModule} from "../../../components/imageloader/imageloader.module";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {TranslateModule} from "@ngx-translate/core";
import {MatPaginatorModule} from "@angular/material/paginator";
import {ComponentsModule} from "../../../components/components/components.module";

const routes: Routes = [
  {
    path: '',
    component: CustomersPage
  }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        MatCardModule,
        ImageloaderModule,
        FontAwesomeModule,
        TranslateModule.forChild(),
        MatPaginatorModule,
        ComponentsModule,
    ],
  declarations: [CustomersPage]
})
export class CustomersPageModule {}
