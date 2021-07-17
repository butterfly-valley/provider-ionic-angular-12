import {UserPage} from './user.page';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {ProfilePage} from '../profile/profile.page';


const routes = [
    {
        path: '',
        children: [
            {
                path: 'management',
                component: UserPage,
                children: [
                    {
                        path: 'schedule',
                        loadChildren: './schedule/schedule.module#SchedulePageModule' },
                    {
                        path: 'appointments',
                        loadChildren: './appointments/appointments.module#AppointmentsPageModule'
                    },
                    {
                        path: 'messages',
                        loadChildren: './messages/messages.module#MessagesPageModule'
                    },
                    {
                        path: 'customers',
                        loadChildren: './customers/customers.module#CustomersPageModule'
                    },
                    {
                        path: 'refresh',
                        loadChildren: './profile/refresh/refresh.module#RefreshPageModule'
                    }
               ]
            },
            {
                path: 'profile',
                component: ProfilePage,
                children: [
                    {
                        path: 'account',
                        loadChildren: '../profile/account/account.module#AccountPageModule'
                    },
                    {
                        path: 'page',
                        loadChildren: '../profile/page/page.module#PagePageModule'
                    },
                    {
                        path: 'employees',
                        loadChildren: '../profile/employees/employees.module#EmployeesPageModule'
                    },
                    {
                        path: 'payments',
                        loadChildren: '../profile/payments/payments.module#PaymentsPageModule'
                    },
                    {
                        path: 'refresh',
                        loadChildren: './profile/refresh/refresh.module#RefreshPageModule'
                    },
                    {
                        path: 'employee-profile',
                        loadChildren: () => import('../profile/employee-profile/employee-profile.module').then( m => m.EmployeeProfilePageModule)
                    }


                ]
            },


        ]
    },
  {
    path: 'help',
    loadChildren: () => import('./help/help.module').then( m => m.HelpPageModule)
  },


];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserRoutingModule {

}
