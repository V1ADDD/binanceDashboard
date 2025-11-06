import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
    },
    { 
        path: 'symbol/:symbol', 
        loadComponent: () => import('./features/symbol-details/symbol-details').then(m => m.SymbolDetails)
    }
];
