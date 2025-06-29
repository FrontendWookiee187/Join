import { NgModule } from '@angular/core';
import { RouterModule} from '@angular/router';
import { Routes } from '@angular/router';
import { MainContentComponent } from './main-content/main-content';
import { SummaryComponent } from './summary/summary.component';
import { ContactsComponent } from './contacts/contacts.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { BoardComponent } from './board/board.component';
import { AddTaskComponent } from './add-task/add-task.component';

export const routes: Routes = [

    {
    path: '',
    component: MainContentComponent,
    children: [
      { path: '', component: SummaryComponent },
      { path: 'contacts', component: ContactsComponent },
      { path: 'summary', component: SummaryComponent },
      { path: 'add-task', component: AddTaskComponent },
      { path: 'imprint', component: LegalNoticeComponent },
      { path: 'privacy', component: PrivacyPolicyComponent },
      { path: 'board', component: BoardComponent },
    ]
  }

];
