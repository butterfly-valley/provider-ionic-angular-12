import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShareRosterPageRoutingModule } from './share-roster-routing.module';

import { ShareRosterPage } from './share-roster.page';
import {MatCardModule, MatFormFieldModule, MatSelectModule} from '@angular/material';
import {ComponentsModule} from '../../../components/components/components.module';
import {TranslateModule} from '@ngx-translate/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {HideHeaderModule} from '../../../directives/hide-header/hide-header.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ShareRosterPageRoutingModule,
        MatCardModule,
        ComponentsModule,
        TranslateModule.forChild(),
        ReactiveFormsModule,
        FontAwesomeModule,
        MatFormFieldModule,
        MatSelectModule,
        HideHeaderModule,
    ],
  declarations: [ShareRosterPage]
})
export class ShareRosterPageModule {}
