import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { EmployeesPage } from './employees.page';
import {ComponentsModule} from "../../../components/components/components.module";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {MatCardModule} from "@angular/material/card";
import {MatPaginatorModule} from "@angular/material/paginator";
import {ImageloaderModule} from "../../../components/imageloader/imageloader.module";
import {TranslateModule} from "@ngx-translate/core";
import {FullCalendarModule} from '@fullcalendar/angular';
import {MatFormFieldModule, MatSelectModule} from '@angular/material';
import {NgbTimepickerModule} from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  {
    path: '',
    component: EmployeesPage
  }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        ComponentsModule,
        FontAwesomeModule,
        MatCardModule,
        MatPaginatorModule,
        ImageloaderModule,
        TranslateModule,
        FullCalendarModule,
        MatFormFieldModule,
        MatSelectModule,
        NgbTimepickerModule
    ],
  declarations: [EmployeesPage]
})
export class EmployeesPageModule {}
