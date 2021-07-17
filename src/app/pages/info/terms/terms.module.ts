import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { TermsPage } from './terms.page';
import {ComponentsModule} from '../../../components/components/components.module';
import {TranslateModule} from '@ngx-translate/core';
import {MatCardModule} from "@angular/material/card";

const routes: Routes = [
  {
    path: '',
    component: TermsPage
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
    ],
  declarations: [TermsPage],

})
export class TermsPageModule {}
