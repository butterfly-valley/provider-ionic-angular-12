import { NgModule } from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {UserGuard} from './services/guards/user.guard';

const routes: Routes = [
    { path: '', loadChildren: './pages/home/home.module#HomePageModule' },
    { path: 'info',
        children: [
            { path: '', loadChildren: './pages/info/terms/terms.module#TermsPageModule' },
            { path: 'terms', children: [
                    {path: '', loadChildren: './pages/info/terms/terms.module#TermsPageModule'},
                    { path: 'app', loadChildren: './pages/info/terms/app/app.module#AppPageModule' }
                ] },
            {
                path: 'pricing',
                loadChildren: './pages/info/pricing/pricing.module#PricingPageModule'
            }
        ]},
    { path: 'login',
        children: [
            {
                path: '',
                loadChildren: './pages/login/login.module#LoginPageModule'
            }
        ]
    },
    { path: 'register', loadChildren: './pages/register/register.module#RegisterPageModule' },
    { path: 'user', loadChildren: './pages/user/user.module#UserPageModule', canLoad: [UserGuard] },
    {
        path: 'app',
        loadChildren: () => import('./pages/info/terms/app/app.module').then( m => m.AppPageModule)
    },
    {
        path: 'roster',
        loadChildren: () => import('./pages/roster/share-roster/share-roster.module').then( m => m.ShareRosterPageModule)
    },
    { path: '**', loadChildren: './pages/errors/page404/page404.module#Page404PageModule' },




];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
