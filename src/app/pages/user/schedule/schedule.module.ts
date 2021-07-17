import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SchedulePage } from './schedule.page';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatDividerModule} from '@angular/material/divider';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDatepickerModule, MatFormFieldModule, MatSelectModule, MatTreeModule} from '@angular/material';
import {ComponentsModule} from '../../../components/components/components.module';
import {FullCalendarModule} from '@fullcalendar/angular';
import {TranslateModule} from '@ngx-translate/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {ViewconfigComponent} from '../../../components/popover/viewconfig/viewconfig.component';
import {MatCardModule} from "@angular/material/card";

const routes: Routes = [
  {
    path: '',
    component: SchedulePage
  }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        MatToolbarModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatDatepickerModule,
        MatTreeModule,
        ComponentsModule,
        FullCalendarModule,
        MatFormFieldModule,
        MatSelectModule,
        TranslateModule.forChild(),
        FontAwesomeModule,
        ReactiveFormsModule,
        MatCardModule,
    ],
  declarations: [SchedulePage],
    entryComponents: [ViewconfigComponent]
})
export class SchedulePageModule {}
