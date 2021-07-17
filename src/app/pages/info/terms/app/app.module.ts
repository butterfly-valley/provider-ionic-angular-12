import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AppPageRoutingModule } from './app-routing.module';

import { AppPage } from './app.page';
import {TranslateModule} from "@ngx-translate/core";
import {ComponentsModule} from "../../../../components/components/components.module";
import {MatCardModule} from "@angular/material/card";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        AppPageRoutingModule,
        TranslateModule,
        ComponentsModule,
        MatCardModule
    ],
  declarations: [AppPage]
})
export class AppPageModule {}
