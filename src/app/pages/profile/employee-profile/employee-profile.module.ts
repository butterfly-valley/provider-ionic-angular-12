import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EmployeeProfilePageRoutingModule } from './employee-profile-routing.module';

import { EmployeeProfilePage } from './employee-profile.page';
import {ComponentsModule} from '../../../components/components/components.module';
import {TranslateModule} from '@ngx-translate/core';
import {MatCardModule, MatFormFieldModule, MatSelectModule} from '@angular/material';
import {NgxIntlTelInputModule} from 'ngx-intl-tel-input';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        EmployeeProfilePageRoutingModule,
        ComponentsModule,
        TranslateModule.forChild(),
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        NgxIntlTelInputModule
    ],
  declarations: [EmployeeProfilePage]
})
export class EmployeeProfilePageModule {}
