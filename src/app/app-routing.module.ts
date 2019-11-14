import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './content_comps/home/home.component';

const appRoutes = [
    // main routes
    {path: '', component: HomeComponent}
]

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes),
    ],
    exports: [RouterModule]
})


export class AppRoutingModule {

}