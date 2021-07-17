import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule} from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';
import {TranslateModule} from '@ngx-translate/core';
import {ComponentsModule} from '../../components/components/components.module';
import {AgmCoreModule} from '@agm/core';
import {MatFormFieldModule, MatSelectModule} from '@angular/material';
import {HideHeaderModule} from '../../directives/hide-header/hide-header.module';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';


const routes: Routes = [
    {
        path: '',
        component: HomePage
    }
];

@NgModule({
    imports: [
        CommonModule,
        ComponentsModule,
        IonicModule,
        RouterModule.forChild(routes),
        TranslateModule.forChild(),
        ReactiveFormsModule,
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyDm5F2ZmWc2yxVZqBsVLme8dfLPS5EGN9Y',
            libraries: ['places'],
        }),
        MatFormFieldModule,
        MatSelectModule,
        HideHeaderModule,
        FontAwesomeModule
    ],
    declarations: [HomePage]
})
export class HomePageModule {}
