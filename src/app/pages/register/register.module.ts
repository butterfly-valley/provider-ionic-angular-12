import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { RegisterPage } from './register.page';
import {ComponentsModule} from "../../components/components/components.module";
import {MatStepperModule} from "@angular/material/stepper";
import {TranslateModule} from "@ngx-translate/core";
import {MatCardModule} from "@angular/material/card";
import {MatSelectModule} from "@angular/material/select";
import {NgxCaptchaModule} from "ngx-captcha";
import {NgxIntlTelInputModule} from "ngx-intl-tel-input";

const routes: Routes = [
  {
    path: '',
    component: RegisterPage
  }
];

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        RouterModule.forChild(routes),
        ComponentsModule,
        ReactiveFormsModule,
        MatStepperModule,
        TranslateModule.forChild(),
        MatCardModule,
        MatSelectModule,
        NgxCaptchaModule,
        NgxIntlTelInputModule,
        FormsModule,

    ],
  declarations: [RegisterPage]
})
export class RegisterPageModule {}
