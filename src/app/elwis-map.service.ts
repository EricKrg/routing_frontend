import { Injectable, EventEmitter } from "@angular/core";
import { DataFetcherService } from "./data-fetcher.service";
import {
    latLng, Leaflet, tileLayer, map, Map, locationfound, geoJSON, polygon, circle, Path, DomEvent, DomUtil, control, InteractiveLayerOptions,
    CRS, Layer, GeoJSON, layerGroup, FeatureGroup, LayerGroup, LeafletMouseEvent, popup, circleMarker, TileLayer, latLngBounds,
    LatLng, GeoJSONOptions, SVG, Tooltip
} from 'leaflet';

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

@Injectable({
    providedIn: 'root'
})
export class ElwisMapService {

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

    constructor(
        private datafetcher: DataFetcherService
    ) {

    }
    // get trafffic data from nts service and add it to map
    subTrafficData(map: any, trafficLayers: LayerGroup, activeTrafficInfo: LayerGroup): void {
        this.datafetcher.getTraffic().subscribe((res: any) => {
            const trafficInfo = res["ntsMessages"]["FTM"];
            let trafficPoints = [];
            let lines = { type: "FeatureCollection", features: [] };
            let linesSimple = []
            for (const feature of trafficInfo.features) {
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
            L.geoJSON(linesSimple, this.outline).addTo(trafficLayers);
            const lineLayer = L.geoJSON(lines, this.layerStyle).addTo(trafficLayers);
            const pointLayer = L.geoJSON(trafficPoints, { pointToLayer: this.trafficpoints2Layer }).addTo(trafficLayers);
            // add layer to map
            trafficLayers.addTo(map);
            // add event listners
            this.clickListner(lineLayer, activeTrafficInfo, this.datafetcher.trafficClick);
            this.clickListner(pointLayer, activeTrafficInfo, this.datafetcher.trafficClick);
            this.dbclickListner(lineLayer, this.datafetcher.activeTrafficInfo);
            this.dbclickListner(pointLayer, this.datafetcher.activeTrafficInfo);
            this.hoverListner(lineLayer, this.hoverStyle, { weight: 3 });
            this.hoverListner(pointLayer, this.hoverStyle, { weight: 2, radius: 4 });
        });
    }
    // get routing response and add it to the map
    subRoutingResponse(map: any, routingLayers: LayerGroup, toolTipLayer: LayerGroup): void {
        this.datafetcher.connectionResponse.subscribe((res: any) => {
            routingLayers.clearLayers();
            toolTipLayer.clearLayers();
            // route response
            const route = res["route"]
            const segments = res["routeSegments"]

            if (segments === null) {
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
            const routeOutline = L.geoJSON(route, outline);
            const routeLayer = L.geoJSON(route, {
                style: this.styleRoute,
                onEachFeature: this.onRouteDetail
            });
            // added fetched response routr to map
            routeOutline.addTo(routingLayers);
            routeLayer.addTo(routingLayers);
            // add segments labels
            let i = 0; let j = 0
            circles.forEach((c) => {
                let label = new L.Tooltip({
                    noHide: true, // Force label to be shown permanently.
                    permanent: true,
                    direction: 'center',
                    className: 'text'
                });

                if (i === 0) {
                    c.addTo(routingLayers)
                    label.setContent("" + j).setLatLng(c._latlng).addTo(routingLayers);
                    j++
                }
                if (i % 4 === 0) {
                    c.addTo(routingLayers)
                    label.setContent("" + j).setLatLng(c._latlng).addTo(routingLayers);
                    j++
                }
                if (i === circles.length - 1) {
                    c.addTo(routingLayers)
                    label.setContent("" + j).setLatLng(c._latlng).addTo(routingLayers);
                    j++
                }
                i++;
            });

            this.hoverListner(routeLayer, this.hoverStyle, { weight: 2 })
            map.fitBounds(routeLayer.getBounds())

            // add label
            route.features.forEach((feature) => {
                let tooltip = new L.Tooltip({
                    noHide: true, // Force label to be shown permanently.
                    permanent: true,
                    direction: 'auto',
                    className: 'delay'
                });
                if (feature.properties.delay > 0) {
                    let mid = [feature.geometry.coordinates[Math.trunc(feature.geometry.coordinates.length / 2)][1],
                    feature.geometry.coordinates[Math.trunc(feature.geometry.coordinates.length / 2)][0]]
                    tooltip.setContent("<b>Delay:</b> " + feature.properties.delay + "h").setLatLng(mid).addTo(toolTipLayer)
                }
            });
            // add tooltiplistner to dynamically remove and add delay tooltips
            this.mapTooltipListner(map, "zoomend", toolTipLayer, 9)
        });
    }

    getActiveTrafficInfo(map: Map, activeTrafficLayer: LayerGroup): void {
        this.datafetcher.activeTrafficInfo.subscribe((res) => {
          let activeTraffic;
          activeTrafficLayer.clearLayers();
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
            }).addTo(activeTrafficLayer);
          } else {
            const outline = L.geoJSON(res, { color: "#fff", weight: 12 }).addTo(activeTrafficLayer);
            activeTraffic = L.geoJSON(res, { weight: 8, color: "#f75f00" }).addTo(activeTrafficLayer);
          }
          map.fitBounds(activeTraffic.getBounds())
        })
      }

    clickListner(layer: any, layerGroup: LayerGroup, clickEmitter: EventEmitter<any>): void {
        layer.on('click', (e) => {
            layerGroup.clearLayers();
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

    styleRoute(feature): object {
        if (feature.properties.closeCall) {
            return { color: "#9656a1", weight: 10 };

        }
        if (feature.properties.delay) {
            return { color: "#9d0b0b", weight: 4 };
        }
        return { color: "#ff7e67", dashArray: "3", weight: 2 };
    }

    onRouteDetail(feature, layer): void {
        // placeholder
    }

    // remove tooltips from segments with delay based on the zoom level
    mapTooltipListner(map: Map, action: string, layer: any, zoom: number) {
        let oldZoom;
        map.on(action, function () {
            if (oldZoom > zoom && map.getZoom() >= zoom) {
                console.log("no clear")
                return;
            }
            if (oldZoom < zoom && map.getZoom() <= zoom) {
                console.log("no clear")
                return;
            }
            if (map.getZoom() > zoom) {
                console.log("show")
                oldZoom = map.getZoom()
                map.addLayer(layer)
            } else {
                oldZoom = map.getZoom()
                console.log("clear!")
                map.removeLayer(layer);
            }

        })
    }


}