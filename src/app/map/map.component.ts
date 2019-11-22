import { Component, OnInit, EventEmitter } from '@angular/core';
import {
  latLng, Leaflet, tileLayer, map, Map, locationfound, geoJSON, polygon, circle, Path, DomEvent, DomUtil, control, InteractiveLayerOptions,
  CRS, Layer, GeoJSON, layerGroup, FeatureGroup, LayerGroup, LeafletMouseEvent, popup, circleMarker, TileLayer, latLngBounds,
  LatLng, GeoJSONOptions, SVG, Tooltip
} from 'leaflet';
import { LocatorService } from '../locator.service';
import { DataFetcherService } from '../data-fetcher.service';

declare var L: Leaflet;

function getColor(type: String): String {
  switch (type) {
    case 'INFORMATION': return "#2EC4B6";
    case 'OBSTRUCTION': return "#FF9F1C";
    case 'WARNING': return "#E55934";
    case 'LOCKING': return "#E71D36";
    default: return "#f75f00"
  }
}

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
  private trafficLayers: LayerGroup = layerGroup();
  private activeTrafficLayer: LayerGroup = layerGroup();
  private toolTipLayer: LayerGroup = layerGroup();
  private tracker: LayerGroup = layerGroup();
  private route;
  private trafficInfo;

  // layerstyles
  layerStyle: object = {
    style: function (feature) {
      return {
        color: getColor(feature.properties.messageType),
        weight: 3, opacity: 0.8, smoothFactor: 1
      };
    }
  };
  outline: object = {
    style: function () {
      return { color: "#fff", weight: 6 };

    }
  };

  hoverStyle: object = { weight: 16, radius: 14 };


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

  hydda: TileLayer = tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  wmsLayer: TileLayer = tileLayer.wms('https://atlas.wsv.bund.de/bwastr/wms?', {
    layers: 'Gewaessernetz', format: "image/png", transparent: "true"
  })

  baseMaps: any = {
    'light': this.cartoDB_Voyager,
    'dark': this.cartoDB_DarkMatter,
    'water': this.hydda
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
    this.map = map('map', {
      center: [52.5, 13.4],
      zoom: 14,
      preferCanvas: true,
      maxZoom: 14,
      minZoom: 6,
      layers: [this.cartoDB_Voyager, this.wmsLayer,
      this.activeTrafficLayer, this.geojsonLayers, this.routeLayers, this.tracker, this.toolTipLayer]
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

    this.getTrafficInfo();
    // listens to map clicks, zooms and highlights feature
    this.getActiveTrafficInfo();

    this.datafetcher.connectionResponse.subscribe((res: any) => {
      this.routeLayers.clearLayers();
      this.toolTipLayer.clearLayers();
      console.log(res)
      this.route = res["route"]
      let segments = res["routeSegments"]

      if(segments === null) {
        // no route
        return;
      }

      const outline: object = {
        style: function (feature) {
          return { color: "#e8dbdb", weight: 6 };

        }
      };
      let circles = [];
      let c; let p;
      for (const seg of segments) {
        let avgCoords = [seg["ya"], seg["xa"]]//[(seg["ya"] + seg["yz"]) / 2, (seg["xa"] + seg["xz"]) / 2]
        c = circleMarker(avgCoords, {
          color: 'white',
          fillColor: "black",
          // Stroke properties
          opacity: 0.75,
          weight: 4,
          // Fill properties
          fillOpacity: 0.9,
          radius: 9
        });
        p = new L.Popup({ autoClose: false, closeOnClick: false })
          .setContent("<small><b>" + new Date(seg["time"]).toLocaleDateString() + "</b><br>" +
            new Date(seg["time"]).toLocaleTimeString() + "</small>")
          .setLatLng(avgCoords);
        c.bindPopup(p);
        circles.push(c);
      }
      const routeOutline = L.geoJSON(this.route, outline);
      const routeLayer = L.geoJSON(this.route, {
        style: this.styleRoute,
        onEachFeature: this.onRouteDetail
      });

      routeOutline.addTo(this.routeLayers);
      routeLayer.addTo(this.routeLayers);
      let i = 0; let j = 0
      circles.forEach((c) => {
        let label = new L.Tooltip({
          noHide: true, // Force label to be shown permanently.
          permanent: true,
          direction: 'center',
          className: 'text'
        });

        if (i === 0) {
          c.addTo(this.routeLayers)
          label.setContent("" + j).setLatLng(c._latlng).addTo(this.routeLayers);
          j++
        }
        if (i % 4 === 0) {
          c.addTo(this.routeLayers)
          label.setContent("" + j).setLatLng(c._latlng).addTo(this.routeLayers);
          j++
        }
        if (i === circles.length - 1) {
          c.addTo(this.routeLayers)
          label.setContent("" + j).setLatLng(c._latlng).addTo(this.routeLayers);
          j++
        }
        i++;
      });

      this.hoverListner(routeLayer, this.hoverStyle, { weight: 2 })
      this.map.fitBounds(routeLayer.getBounds())

      // add label
      this.route.features.forEach((feature) => {
        let tooltip = new L.Tooltip({
          noHide: true, // Force label to be shown permanently.
          permanent: true,
          direction: 'auto',
          className: 'delay'
        });
        if (feature.properties.delay > 0) {
          let mid = [feature.geometry.coordinates[Math.trunc(feature.geometry.coordinates.length / 2)][1],
          feature.geometry.coordinates[Math.trunc(feature.geometry.coordinates.length / 2)][0]]
          tooltip.setContent("<b>Delay:</b> "+ feature.properties.delay + "h").setLatLng(mid).addTo(this.toolTipLayer)
        }
      });
      this.mapTooltipListner(this.map, "zoomend", this.toolTipLayer, 9)
    });
    //this.map.on('click', (e) => { console.log(e.latlng); });
  }

  getRoute(): void {

  }
  /**
   * todo: 
   *  - create service for traffic infos
   * get traffic info and add it to the map
   */
  getTrafficInfo(): void {
    this.datafetcher.getTraffic().subscribe((res: any) => {
      this.trafficInfo = res["ntsMessages"]["FTM"];
      let trafficPoints = [];
      let lines = { type: "FeatureCollection", features: [] };
      let linesSimple = []
      for (const feature of this.trafficInfo.features) {
        if (feature.geometry.type === "Point") {
          trafficPoints.push(feature);
        } else {
          // create a small offset
          let offset = 0.0001;
          switch (feature.properties.messageType) {
            case 'INFORMATION': offset = 0.0009;
            case 'OBSTRUCTION': offset = 0.0004;
            case 'WARNING': offset = 0.0002;
            case 'LOCKING': offset = 0.0001;
          }
          feature.geometry.geometries[2].coordinates = feature.geometry.geometries[2].coordinates.
            map((value) => { return [value[0] - offset, value[1] + offset] });
          feature.geometry = feature.geometry.geometries[2]
          lines.features.push(feature);
          linesSimple.push(feature.geometry);
        }
      }
      // add to traffic layer
      L.geoJSON(linesSimple, this.outline).addTo(this.trafficLayers);
      const lineLayer = L.geoJSON(lines, this.layerStyle).addTo(this.trafficLayers);
      const pointLayer = L.geoJSON(trafficPoints, { pointToLayer: this.trafficpoints2Layer }).addTo(this.trafficLayers);

      // add layer to map
      this.trafficLayers.addTo(this.map);
      this.clickListner(lineLayer, this.datafetcher.trafficClick);
      this.clickListner(pointLayer, this.datafetcher.trafficClick);
      this.dbclickListner(lineLayer, this.datafetcher.activeTrafficInfo);
      this.dbclickListner(pointLayer, this.datafetcher.activeTrafficInfo);
      this.hoverListner(lineLayer, this.hoverStyle, { weight: 3 });
      this.hoverListner(pointLayer, this.hoverStyle, { weight: 2, radius: 4 });
    });
  }

  getActiveTrafficInfo(): void {
    this.datafetcher.activeTrafficInfo.subscribe((res) => {
      let activeTraffic;
      this.activeTrafficLayer.clearLayers();
      if (res === undefined) return;
      // different style for point or line
      if ("Point".match(res.type)) {
        activeTraffic = L.geoJSON(res, {
          pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
              color: 'white',
              fillColor: "#f75f00",
              // Stroke properties
              opacity: 0.75,
              weight: 4,
              // Fill properties
              fillOpacity: 0.9,
              radius: 13
            });
          }
        }).addTo(this.activeTrafficLayer);
      } else {
        const outline = L.geoJSON(res, { color: "#fff", weight: 12 }).addTo(this.activeTrafficLayer);
        activeTraffic = L.geoJSON(res, { weight: 8, color: "#f75f00" }).addTo(this.activeTrafficLayer);
      }
      this.map.fitBounds(activeTraffic.getBounds())
    })
  }

  trafficpoints2Layer(feature, latlng) {
    return L.circleMarker(latlng, {
      color: 'white',
      fillColor: getColor(feature.properties.messageType),
      // Stroke properties
      opacity: 0.75,
      weight: 2,
      // Fill properties
      fillOpacity: 0.9,
      radius: 4
    });
  }

  onRouteDetail(feature, layer): void {
   
  }

  styleRoute(feature): object {
    if (feature.properties.closeCall) {
      return { color: "#9656a1", weight: 10 };

    }
    if (feature.properties.delay) {
      return { color: "#9d0b0b", weight: 4 };
    }
    return { color: "#ff7e67", dashArray: "3", weight: 2 };
  }

  // emits the data from a map click on specific layer
  clickListner(layer: any, clickEmitter: EventEmitter<any>): void {
    layer.on('click', (e) => {
      this.activeTrafficLayer.clearLayers();
      clickEmitter.emit(e);
    });
  }

  // emits the data from a map click on specific layer
  dbclickListner(layer: any, clickEmitter: EventEmitter<any>): void {
    layer.on('dblclick', (e) => {
      clickEmitter.emit(e.sourceTarget.feature);
    });
  }

  hoverListner(layer: any, hoverStyle, baseStyle: any): void {
    layer.on("mouseover", (e) => {
      e.sourceTarget.setStyle(hoverStyle)
    })
    layer.on("mouseout", (e) => {
      e.sourceTarget.setStyle(baseStyle);
    })
  }

  mapTooltipListner(map: Map, action: string, layer: any, zoom: number) {
    let oldZoom;
    map.on(action, function () {
      if(oldZoom > zoom && map.getZoom() >= zoom) {
        console.log("no clear")
        return;
      }
      if(oldZoom < zoom && map.getZoom() <= zoom) {
        console.log("no clear")
        return;
      }
      if (map.getZoom() > zoom) {
        console.log("show")
        oldZoom =  map.getZoom()
        //this.toolTipLayer.setStyle({opacity: 1, fillOpacity: 1})
        map.addLayer(layer)
      } else {
        oldZoom = map.getZoom() 
        console.log("clear!")
        //this.toolTipLayer.setStyle({opacity: 0, fillOpacity: 0})
        map.removeLayer(layer);
      }

    })
  }

}

