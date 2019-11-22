import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from "@angular/forms";

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { DataFetcherService } from './data-fetcher.service';
import { HomeComponent } from './content_comps/home/home.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { LocatorService } from './locator.service';
import { DatePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { MaterialModule } from './material-modul';
import { TrafficContentComponent } from './content_comps/traffic-content/traffic-content.component';
import { RouteInfoComponent } from './content_comps/route-info/route-info.component';



@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    HomeComponent,
    TrafficContentComponent,
    RouteInfoComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    OwlDateTimeModule, 
    OwlNativeDateTimeModule,
    MaterialModule
 
  ],
  providers: [DataFetcherService, LocatorService, DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { 
  
}
