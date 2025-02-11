import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  showSideBar: boolean = false;

  toggleFilterPanel(): void {
    this.showSideBar = !this.showSideBar;
  }

}
