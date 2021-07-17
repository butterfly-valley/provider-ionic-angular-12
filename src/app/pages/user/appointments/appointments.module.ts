import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AppointmentsPage } from './appointments.page';
import {TranslateModule} from '@ngx-translate/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {ImageloaderModule} from '../../../components/imageloader/imageloader.module';
import {MatDatepickerModule, MatFormFieldModule, MatSelectModule, MatSidenavModule} from '@angular/material';
import {HideHeaderModule} from '../../../directives/hide-header/hide-header.module';
import {ComponentsModule} from '../../../components/components/components.module';
import {MatCardModule} from "@angular/material/card";
import {MatPaginatorModule} from "@angular/material/paginator";


const routes: Routes = [
  {
    path: '',
    component: AppointmentsPage
  }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        TranslateModule.forChild(),
        FontAwesomeModule,
        ImageloaderModule,
        MatFormFieldModule,
        MatSelectModule,
        HideHeaderModule,
        MatSidenavModule,
        MatDatepickerModule,
        ComponentsModule,
        MatCardModule,
        MatPaginatorModule
    ],
  declarations: [AppointmentsPage],
})
export class AppointmentsPageModule {}
