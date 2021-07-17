import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PricingPageRoutingModule } from './pricing-routing.module';

import { PricingPage } from './pricing.page';
import {ComponentsModule} from '../../../components/components/components.module';
import {MatCardModule} from '@angular/material';
import {TranslateModule} from '@ngx-translate/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PricingPageRoutingModule,
        ComponentsModule,
        MatCardModule,
        TranslateModule.forChild(),
        FontAwesomeModule,
    ],
  declarations: [PricingPage]
})
export class PricingPageModule {}
