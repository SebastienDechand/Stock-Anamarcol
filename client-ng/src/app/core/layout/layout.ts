import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { UiFacade } from '../../store/ui/facade/ui.facade';
import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, Sidebar, Topbar],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements OnInit {
  protected uiFacade = inject(UiFacade);

  ngOnInit() {
    const isDesktop = window.innerWidth >= 1024;
    this.uiFacade.setSidebarOpen(isDesktop);
  }
}
