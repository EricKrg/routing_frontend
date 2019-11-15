import { Component, OnInit, EventEmitter } from '@angular/core';
import {
  latLng, Leaflet, tileLayer, map, Map, locationfound, geoJSON, polygon, circle, Path, DomEvent, DomUtil, control, InteractiveLayerOptions,
  CRS, Layer, GeoJSON, layerGroup, FeatureGroup, LayerGroup, LeafletMouseEvent, popup, circleMarker, TileLayer, latLngBounds,
  LatLng, GeoJSONOptions, SVG
} from 'leaflet';

import 'leaflet-routing-machine';
import { LocatorService } from '../locator.service';
import { DataFetcherService } from '../data-fetcher.service';
import { ActivatedRoute, Router } from '@angular/router';
import { fcall } from 'q';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

declare var L: Leaflet;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  private map: Map;
  private pos: number[];
  private geojsonLayers: LayerGroup = layerGroup();
  private routeLayers: LayerGroup = layerGroup();
  private tracker: LayerGroup = layerGroup();
  private route;
  private trafficInfo;


  // base maps
  cartoDB_DarkMatter: TileLayer = tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  });
  cartoDB_Voyager: TileLayer = tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  });

  baseMaps: any = {
    'light': this.cartoDB_Voyager,
    'dark': this.cartoDB_DarkMatter,

  };

  overlayMaps: any = {
  };

  locateCircle(e): void {
    this.pos = e.latLng;
    let radius = e.accuracy / 2;
    circle(e.latlng, radius).addTo(this.map);
  }

  constructor(
    private datafetcher: DataFetcherService,
  ) {

  }

  ngOnInit(): void {
    // inital map creation
    this.map = this.map = map('map', {
      center: [52.5, 13.4],
      zoom: 14,
      /*maxZoom: 14,
      minZoom: 6,*/
      renderer: L.canvas({ padding: 0.5 }),
      /*new SVG({
        padding: 1
      }),*/
      layers: [this.cartoDB_Voyager, this.geojsonLayers, this.routeLayers, this.tracker]
    });
    control.layers(this.baseMaps).addTo(this.map);

    this.map.locate({ setView: true, maxZoom: 10 });

    this.map.on('locationfound', (e) => {
      let radius = e.accuracy / 2;
      circle(e.latlng, { color: 'red', fillOpacity: 0.5, radius: radius }).addTo(this.map);
    });

    this.datafetcher.removeEmitter.subscribe((res) => {
      this.geojsonLayers.clearLayers();
      this.tracker.clearLayers();
    });


    this.datafetcher.hoverPos.subscribe((res: any) => {
      this.map.setView([res.lat, res.lon], 12);
    });

    this.datafetcher.getTraffic().subscribe((res: any) => {
      const layerStyle: object = {
        style: function (feature) {
          switch (feature.properties.messageType) {
            case 'INFORMATION': return { color: "#2EC4B6", weight: 5 };
            case 'OBSTRUCTION': return { color: "#FF9F1C", weight: 4 };
            case 'WARNING': return { color: "#E5L.geoJSON(lines, layerStyle).addTo(this.map);5934", weight: 3 };
            case 'LOCKING': return { color: "#E71D36", weight: 5 };
          }
        }
      }
      this.trafficInfo = res["ntsMessages"]["FTM"]
      let trafficPoints = []//{ type: "FeatureCollection", features: []  };
      let lines = { type: "FeatureCollection", features: [] };
      for (const feature of this.trafficInfo.features) {
        if (feature.geometry.type === "Point") {
          //feature.geometry.coordinates = [feature.geometry.coordinates[1],feature.geometry.coordinates[0]]
          //circle([feature.geometry.coordinates[1],feature.geometry.coordinates[0]],20).addTo(this.map)
          //L.geoJSON(feature).addTo(this.map);    
          trafficPoints.push(feature);
        } else {
          lines.features.push(feature);
        }
      }
      console.log(this.trafficInfo)
      console.log(lines)
      console.log(trafficPoints)
      L.geoJSON(lines, layerStyle).addTo(this.map);
      L.geoJson(trafficPoints, {
        /*
         * When each feature is loaded from the GeoJSON this
         * function is called. Here we create a cicle marker
         * for the feature and style the circle marker.
         */
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            color: getColor(feature.properties.messageType),
            fillColor: getColor(feature.properties.messageType),
            // Stroke properties
            opacity: 0.75,
            weight: 2,
            // Fill properties
            fillOpacity: 0.25,
            radius: 1.5
          });
        }
      }).addTo(this.map);
    });

    this.datafetcher.connectionResponse.subscribe((res: any) => {
      this.routeLayers.clearLayers();
      this.route = res["route"]
      let segments = res["routeSegments"]
      console.log(this.route)
      const layerStyle: object = {
        style: function (feature) {
          if (feature.properties.closeCall) {
            return { color: "#9656a1", weight: 10 };

          }
          if (feature.properties.delay) {
            return { color: "#293a80", weight: 5 };
          }
          return { dashArray: "3", weight: 2 };

        }
      }
      const outline: object = {
        style: function (feature) {
          return { color: "#fff", weight: 4 };

        }
      }
      console.log(segments)
      let circles = [];
      let c; let p;
      for (const seg of segments) {
        let avgCoords = [(seg["ya"] + seg["yz"]) / 2, (seg["xa"] + seg["xz"]) / 2]
        c = circle(avgCoords, {
          color: 'black',
          fillOpacity: 0.5,
          radius: 50
        });
        p = new L.Popup({ autoClose: false, closeOnClick: false })
                .setContent("<small><b>"+new Date(seg["time"]).toLocaleDateString() + "</b><br>" +
                            new Date(seg["time"]).toLocaleTimeString()+ "</small>")
                .setLatLng(avgCoords);
        c.bindPopup(p).openPopup()
        circles.push(c);
      }
      const routeOutline = L.geoJSON(this.route, outline);
      const routeLayer = L.geoJSON(this.route, layerStyle);
      routeOutline.addTo(this.routeLayers);
      routeLayer.addTo(this.routeLayers);
      let i = 0;
      circles.forEach((c) =>{
         c.addTo(this.routeLayers)
         if(i === 0) c.openPopup()
         if(i === Math.trunc(circles.length/ 2)) c.openPopup()
         if(i === circles.length - 1) c.openPopup()
         i++;
        });
      this.map.fitBounds(routeLayer.getBounds())
    });


    //this.map.on('click', (e) => { console.log(e.latlng); });
  }
}

function getColor(type: String): String {
  switch (type) {
    case 'INFORMATION': return "#2EC4B6";
    case 'OBSTRUCTION': return "#FF9F1C";
    case 'WARNING': return "#E55934";
    case 'LOCKING': return "#E71D36";
  }
}