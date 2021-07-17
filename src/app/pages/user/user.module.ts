import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule} from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { UserPage } from './user.page';
import {ComponentsModule} from '../../components/components/components.module';
import {TranslateModule} from '@ngx-translate/core';
import {UserRoutingModule} from './user-routing.module';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {MatBadgeModule, MatSelectModule} from '@angular/material';
import {ProfilePageModule} from "../profile/profile.module";
import {MatBadgeModule} from '@angular/material/badge';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonicModule,
        UserRoutingModule,
        ComponentsModule,
        TranslateModule.forChild(),
        FontAwesomeModule,
        MatSelectModule,
        MatBadgeModule,
        ProfilePageModule,
        MatBadgeModule
    ],
  declarations: [UserPage]
})
export class UserPageModule {}
