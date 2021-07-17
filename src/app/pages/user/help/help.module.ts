import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HelpPageRoutingModule } from './help-routing.module';

import { HelpPage } from './help.page';
import {TranslateModule} from "@ngx-translate/core";
import {MatCardModule} from "@angular/material/card";
import {ComponentsModule} from "../../../components/components/components.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HelpPageRoutingModule,
    TranslateModule.forChild(),
    MatCardModule,
    ComponentsModule
  ],
  declarations: [HelpPage]
})
export class HelpPageModule {}
