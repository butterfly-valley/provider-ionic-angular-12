import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule} from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { LoginPage } from './login.page';
import {ComponentsModule} from '../../components/components/components.module';
import {TranslateModule} from '@ngx-translate/core';
import {MatFormFieldModule, MatSelectModule} from '@angular/material';
import {NgxCaptchaModule} from "ngx-captcha";
import {MatCardModule} from "@angular/material/card";

const routes: Routes = [
  {
    path: '',
    component: LoginPage
  }
];

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        ComponentsModule,
        TranslateModule.forChild(),
        MatFormFieldModule,
        MatSelectModule,
        NgxCaptchaModule,
        MatCardModule
    ],
  declarations: [LoginPage]
})
export class LoginPageModule {}
