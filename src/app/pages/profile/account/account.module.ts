import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AccountPage } from './account.page';
import {MatExpansionModule} from "@angular/material/expansion";
import {TranslateModule} from "@ngx-translate/core";
import {MatSelectModule} from "@angular/material/select";
import {MatCardModule} from "@angular/material/card";
import {NgxIntlTelInputModule} from "ngx-intl-tel-input";
import {AgmCoreModule} from "@agm/core";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {ComponentsModule} from "../../../components/components/components.module";

const routes: Routes = [
  {
    path: '',
    component: AccountPage
  }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        TranslateModule.forChild(),
        MatExpansionModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatCardModule,
        NgxIntlTelInputModule,
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyDm5F2ZmWc2yxVZqBsVLme8dfLPS5EGN9Y',
            libraries: ['places'],
        }),
        FontAwesomeModule,
        ComponentsModule,
    ],
  declarations: [AccountPage]
})
export class AccountPageModule {}
