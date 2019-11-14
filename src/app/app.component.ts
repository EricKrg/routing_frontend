import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataFetcherService } from './data-fetcher.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private router: Router, 
    private route: ActivatedRoute,
    private dataFetcher: DataFetcherService
    ){}
  title = 'FlyPy';

}
