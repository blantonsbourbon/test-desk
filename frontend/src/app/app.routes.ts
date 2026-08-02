import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell.component';
import { CatalogPage } from './pages/catalog/catalog.page';
import { ExecutionDetailPage } from './pages/executions/execution-detail.page';
import { ExecutionsPage } from './pages/executions/executions.page';
import { PrototypeTestTypesPage } from './pages/executions/prototype-test-types.page';
import { SourcesPage } from './pages/sources/sources.page';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'catalog' },
      { path: 'catalog', component: CatalogPage },
      { path: 'executions', component: ExecutionsPage },
      { path: 'executions/prototype-test-types', component: PrototypeTestTypesPage },
      { path: 'executions/:executionId', component: ExecutionDetailPage },
      { path: 'sources', component: SourcesPage },
    ],
  },
  { path: '**', redirectTo: 'catalog' },
];
