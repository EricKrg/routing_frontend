import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataFetcherService } from 'src/app/data-fetcher.service';
import { error } from '@angular/compiler/src/util';

interface requestObj {
    id: string;
    km: number;
}

interface requestBody {
    bwastrIdFrom: string;
    bwastrKmFrom: number;
    bwastrIdTo: string;
    bwastrKmTo: number;
}

@Component({
    selector: 'app-control',
    templateUrl: './control.component.html',
    styleUrls: ['./control.component.css']
})

export class ControlComponent implements OnInit {
    reqArray: requestObj[] = [
        { id: "3101", km: 100 },
        { id: "0701", km: 650 },
    ];
    isExpand: boolean = true;
    selectedMoment: Date;
    vType: string = "BSF";
    style: number = 0;
    speed: number = 15;
    opt: boolean = false;
    oneWay: boolean = false;
    isAnalyze: boolean = false;
    isLoading: boolean = false;

    constructor(
        private dataFetcher: DataFetcherService,
        private datePipe: DatePipe,
    ) {
    }

    ngOnInit() {
    }

    addStop(): void {
        this.reqArray.push({ id: "to", km: 0 })
    }

    removeStop(i: number): void {
        this.reqArray.splice(i, 1);
    }

    // build requestbody 
    buildRequest(): object {
        let body: requestBody = {
            bwastrIdFrom: "",
            bwastrKmFrom: 0,
            bwastrIdTo: "",
            bwastrKmTo: 0
        };
        let bodyArr: requestBody[] = [];
        let pointsArr: requestObj[] = [];

        let j: number = 0;
        let i: number = 0;
        for (const obj of this.reqArray) {
            pointsArr.push(obj);
            if (j > 0 && j < this.reqArray.length - 1) {
                pointsArr.push(obj);
            }
            j = j + 1;
        }
        for (const obj of pointsArr) {
            if (i % 2 === 0) {
                body.bwastrIdFrom = obj.id;
                body.bwastrKmFrom = obj.km;
            } else {
                body.bwastrIdTo = obj.id;
                body.bwastrKmTo = obj.km;

                bodyArr.push(body);
                body = {
                    bwastrIdFrom: "",
                    bwastrKmFrom: 0,
                    bwastrIdTo: "",
                    bwastrKmTo: 0
                };
            }
            i = i + 1;
        }
        return bodyArr;
    }

    // building request, set params and call api
    async findRoute() {
        this.isLoading = true;
        let params: string = "?type=" + this.vType + "&style=" +
            this.style + "&speed=" + this.speed;
        if (this.reqArray.length > 2) {
            params += "&optimize=" + this.opt;
            params += "&oneway=" + this.oneWay;
        }
        if (this.selectedMoment !== undefined) {
            let time = this.datePipe.transform(this.selectedMoment, 'yyyy-MM-dd-HH-mm').toString();
            console.log(time)
            params += "&time=" + time;
        }
        params += "&elwisformat=false";
        params += "&analyze=" + this.isAnalyze;
        
        this.dataFetcher.getRoute(this.buildRequest(), params).subscribe(
            (res) => {
                this.isLoading = false;
                },
            ).add(() => this.isLoading = false);
    }

    typeChange(e: string): void {
        this.vType = e;
        if ("BSF".match(e)) {
            this.style = 0;
        }
    }

    styleChange(s: number): void {
        this.style = s;
    }

    expandCard(): void {
        this.isExpand = this.isExpand ? false : true;
    }
    getBtn(): String {
        if (this.isAnalyze) {
            return "warn"
        }
        return "disabled"
    }
    setAnalyze(): void {
        this.isAnalyze = this.isAnalyze ? false : true;
    }
}
