import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShareRosterPage } from './share-roster.page';

const routes: Routes = [
  {
    path: '',
    component: ShareRosterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShareRosterPageRoutingModule {}
