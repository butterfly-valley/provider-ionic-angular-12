import {Component, OnInit} from '@angular/core';

import {faSignOutAlt, faUserCog} from '@fortawesome/free-solid-svg-icons';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth/auth.service';


@Component({
    selector: 'app-userdropdown',
    templateUrl: './userdropdown.component.html',
    styleUrls: ['./userdropdown.component.scss'],
})
export class UserDropdownComponent implements OnInit {

    signOutIcon = faSignOutAlt;
    profileIcon = faUserCog;


    constructor(private router: Router, private auth: AuthService) { }

    ngOnInit() {}

    navigateToProfile() {
        this.router.navigateByUrl('/user/profile');
    }


    signOut() {
        this.auth.signOut();
    }
}
