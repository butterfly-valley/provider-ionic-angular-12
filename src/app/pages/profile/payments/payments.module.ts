import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PaymentsPage } from './payments.page';
import {ComponentsModule} from "../../../components/components/components.module";
import {TranslateModule} from "@ngx-translate/core";
import {MatCardModule} from "@angular/material/card";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";

const routes: Routes = [
  {
    path: '',
    component: PaymentsPage
  }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        ComponentsModule,
        TranslateModule.forChild(),
        MatCardModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatSelectModule
    ],
  declarations: [PaymentsPage]
})
export class PaymentsPageModule {}
