import { Component, AfterViewInit } from '@angular/core';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM, TileWMS, XYZ } from 'ol/source';
import { MapService } from 'src/app/services/map.service';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke } from 'ol/style';
import { transformExtent } from 'ol/proj';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  map!: Map;
  defaultLayer!: TileLayer<OSM>;
  satelliteLayer!: TileLayer<XYZ>;
  isSatellite: boolean = false;

  isLesseeChecked: boolean = true;

  lesseeBoundaryLayer!: TileLayer<TileWMS>;
  janTotalLayer!: TileLayer<TileWMS>;
  decTotalLayer!: TileLayer<TileWMS>;
  marNearByLayer!: TileLayer<TileWMS>;
  decNearByLayer!: TileLayer<TileWMS>;
  janTCILayer!: TileLayer<TileWMS>;
  decTCILayer!: TileLayer<TileWMS>;

  isJanTotalVisible: boolean = false;
  isDecTotalVisible: boolean = false;
  isMarNearByVisible: boolean = false;
  isDecNearByVisible: boolean = false;
  isJanTCIVisible = false;
  isDecTCIVisible = false;

  janTCILayerOpacity = 1;
  decTCILayerOpacity = 1;
  janTotalLayerOpacity: number = 1.0;
  decTotalLayerOpacity: number = 1.0;
  decNearByLayerOpacity: number = 1.0;
  marNearByLayerOpacity: number = 1.0;
  lesseLayerOpacity: number = 1.0;
  isTotalIllegalMiningVisible: boolean = false;
  isNearByIllegalMiningVisible: boolean = false;
  isTCIVisible: boolean = false;

  lessees: any;
  janTotalLegendUrl: any;
  decTotalLegendUrl: any;

  decNearByLegendUrl: any;
  marNearByLegendUrl: any;

  lesseeLegendUrl: any;
  constructor(private mapService: MapService) { }

  ngAfterViewInit(): void {
    this.initMap();
    this.getJodaBoundary();
    this.initLesseBoundaries();
    this.getAllLessees();
    this.initIllegalMiningLayers();
    this.initNearByIllegalMining();
    // this.initTCILayers();
  }

  // Initialize the map
  initMap(): void {
    this.defaultLayer = new TileLayer({
      source: new OSM(),
    });

    this.satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // Google Satellite
      }),
      visible: false,
    });

    const geoserverUrl = 'http://192.168.25.102:8080/geoserver/wms';

    this.janTCILayer = new TileLayer({
      source: new TileWMS({
        url: geoserverUrl,
        params: {
          LAYERS: 'Illegal_Mining_Analysis:tci_jan',
          TILED: true,
        },
        serverType: 'geoserver',
      }),
      visible: false, // Initially hidden
    });

    this.decTCILayer = new TileLayer({
      source: new TileWMS({
        url: geoserverUrl,
        params: {
          LAYERS: 'Illegal_Mining_Analysis:tci_dec',
          TILED: true,
        },
        serverType: 'geoserver',
      }),
      visible: false, // Initially hidden
    });


    this.map = new Map({
      target: 'map',
      layers: [this.defaultLayer, this.satelliteLayer, this.janTCILayer, this.decTCILayer],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
  }

  // Toggle between Satellite and Default map
  toggleMapType(): void {
    this.isSatellite = !this.isSatellite;
    this.defaultLayer.setVisible(!this.isSatellite);
    this.satelliteLayer.setVisible(this.isSatellite);
  }

  // Fetch Joda boundary from API, add to the map, and zoom to it
  public getJodaBoundary(): void {
    this.mapService.getJodaBoundary().subscribe({
      next: (data: any) => {

        const geoJsonData = {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: data.geometry.coordinates
          },
          properties: {}
        };

        const vectorSource = new VectorSource({
          features: new GeoJSON().readFeatures(geoJsonData, {
            featureProjection: 'EPSG:3857'
          })
        });

        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            // fill: new Fill({
            //   color: 'rgba(0, 0, 255, 0.1)',
            // }),
            stroke: new Stroke({
              color: 'red',
              width: 2,
              lineDash: [4, 4]
            }),
          }),
        });

        this.map.addLayer(vectorLayer);

        // Get the extent of the vector source
        const extent = vectorSource.getExtent();
        const view = this.map.getView();

        // Animate zoom and fit
        view.fit(extent, {
          duration: 2000,
          padding: [50, 50, 50, 50],
        });
      }
    });
  }

  //Fetch all lessees
  getAllLessees(): void {
    this.mapService.getAllLessees().subscribe({
      next: (response) => {
        console.log(response[0].layer);
        this.lessees = response;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  // Initialize Lessee Boundaries
  initLesseBoundaries(): void {
    const geoserverUrl = 'http://192.168.25.102:8080/geoserver/wms';
    this.lesseeLegendUrl = `${geoserverUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=Illegal_Mining_Analysis:kml_joda_lessee&STYLE=&LEGEND_OPTIONS=fontName:Arial;fontSize:12;dpi:96`;

    this.lesseeBoundaryLayer = new TileLayer({
      source: new TileWMS({
        url: geoserverUrl,
        params: {
          LAYERS: 'Illegal_Mining_Analysis:kml_joda_lessee',
          TILED: true,
        },
        serverType: 'geoserver',
      }),
    });

    this.map.addLayer(this.lesseeBoundaryLayer);
  }

  // Dynamic Lessee filter change handler
  onFilterChange(event: any): void {
    const selectedLessee = event.target.value;

    if (selectedLessee) {
      // Find the extent for the selected lessee
      const lesseeData = this.lessees.find((lessee: any) => lessee.layer === selectedLessee);

      this.lesseeBoundaryLayer.getSource()?.updateParams({
        CQL_FILTER: `layer = '${selectedLessee}'`
      });

      if (lesseeData?.extent) {
        console.log(lesseeData);
        const extent = [lesseeData.extent.minx, lesseeData.extent.miny, lesseeData.extent.maxx, lesseeData.extent.maxy]; // Correct order
        const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
        console.log(transformedExtent);
        this.map.getView().fit(transformedExtent, { duration: 1000, padding: [50, 50, 50, 50] });
      }
    } else {
      this.lesseeBoundaryLayer.getSource()?.updateParams({
        CQL_FILTER: ''
      });
      this.getJodaBoundary();
    }
  }

  // Initialize both illegal mining layers
  initIllegalMiningLayers(): void {
    const geoserverUrl = 'http://192.168.25.102:8080/geoserver/wms';
    this.janTotalLegendUrl = `${geoserverUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=Illegal_Mining_Analysis:uw_jan_3_updated_1&STYLE=&LEGEND_OPTIONS=fontName:Arial;fontSize:12;dpi:96`;
    this.decTotalLegendUrl = `${geoserverUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=Illegal_Mining_Analysis:uw_dec_3_updated_1&STYLE=&LEGEND_OPTIONS=fontName:Arial;fontSize:12;dpi:96`;
    this.janTotalLayer = new TileLayer({
      source: new TileWMS({
        url: geoserverUrl,
        params: {
          LAYERS: 'Illegal_Mining_Analysis:uw_jan_3_updated_1',
          TILED: true,
        },
        serverType: 'geoserver',
      }),
      visible: false, // Initially hidden
    });

    this.decTotalLayer = new TileLayer({
      source: new TileWMS({
        url: geoserverUrl,
        params: {
          LAYERS: 'Illegal_Mining_Analysis:uw_dec_3_updated_1',
          TILED: true,
        },
        serverType: 'geoserver',
      }),
      visible: false, // Initially hidden
    });

    this.map.addLayer(this.janTotalLayer);
    this.map.addLayer(this.decTotalLayer);
  }

  // Handel Lesse Visibility
  toggleLesseeVisibility() {
    this.isLesseeChecked = !this.isLesseeChecked;
    this.lesseeBoundaryLayer.setVisible(this.isLesseeChecked);
  }


  // Handle Total Mining checkbox toggle
  toggleIllegalMiningVisibility(): void {
    if (!this.isTotalIllegalMiningVisible) {
      this.isJanTotalVisible = false;
      this.isDecTotalVisible = false;
      this.janTotalLayer.setVisible(false);
      this.decTotalLayer.setVisible(false);
    }
  }

  // Toggle layers independently
  toggleTotalIllegalMiningLayer(month: string): void {
    if (month === "jan") {
      this.janTotalLayer.setVisible(this.isJanTotalVisible);
    } else if (month === "dec") {
      this.decTotalLayer.setVisible(this.isDecTotalVisible);
    }
  }


  // Init NearBy Illegal Mining
  initNearByIllegalMining(): void {
    const geoserverUrl = 'http://192.168.25.102:8080/geoserver/wms';
    this.marNearByLegendUrl = `${geoserverUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=Illegal_Mining_Analysis:sp_outer_mines_march_2024&STYLE=&LEGEND_OPTIONS=fontName:Arial;fontSize:12;dpi:96`;
    this.decNearByLegendUrl = `${geoserverUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=Illegal_Mining_Analysis:sp_outer_mines_dec_2024&STYLE=&LEGEND_OPTIONS=fontName:Arial;fontSize:12;dpi:96`;
    this.marNearByLayer = new TileLayer({
      source: new TileWMS({
        url: geoserverUrl,
        params: {
          LAYERS: 'Illegal_Mining_Analysis:sp_outer_mines_march_2024',
          TILED: true,
        },
        serverType: 'geoserver',
      }),
      visible: false, // Initially hidden
    });

    this.decNearByLayer = new TileLayer({
      source: new TileWMS({
        url: geoserverUrl,
        params: {
          LAYERS: 'Illegal_Mining_Analysis:sp_outer_mines_dec_2024',
          TILED: true,
        },
        serverType: 'geoserver',
      }),
      visible: false, // Initially hidden
    });

    this.map.addLayer(this.marNearByLayer);
    this.map.addLayer(this.decNearByLayer);
  }

  // Handle Total Mining checkbox toggle
  toggleNearBylIllegalMiningVisibility(): void {
    if (!this.isNearByIllegalMiningVisible) {
      this.isMarNearByVisible = false;
      this.isDecNearByVisible = false;
      this.marNearByLayer.setVisible(false);
      this.decNearByLayer.setVisible(false);
    }
  }

  // Toggle layers independently
  toggleNearByIllegalMiningLayer(month: string): void {
    if (month === "mar") {
      this.marNearByLayer.setVisible(this.isMarNearByVisible);
    } else if (month === "dec") {
      this.decNearByLayer.setVisible(this.isDecNearByVisible);
    }
  }

  // ------------------------------------TCI Layer------------------------------------

  // Toggle overall TCI visibility
  toggleTCIVisibility(): void {
    if (!this.isTCIVisible) {
      this.isJanTCIVisible = false;
      this.isDecTCIVisible = false;
      this.janTCILayer.setVisible(false);
      this.decTCILayer.setVisible(false);
    }
  }

  // Toggle individual TCI layers
  toggleTCILayer(month: string): void {
    if (month === "jan") {
      this.janTCILayer.setVisible(this.isJanTCIVisible);
    } else if (month === "dec") {
      this.decTCILayer.setVisible(this.isDecTCIVisible);
    }
  }

  // Update opacity of layers

  updateLayerOpacity(month: string, opacity: number): void {
    switch (month) {
      case "janTotal":
        this.janTotalLayer.setOpacity(opacity);
        break;
      case "decTotal":
        this.decTotalLayer.setOpacity(opacity);
        break;
      case "marNearBy":
        this.marNearByLayer.setOpacity(opacity);
        break;
      case "decNearBy":
        this.decNearByLayer.setOpacity(opacity);
        break;
      case "janTCI":
        this.janTCILayer.setOpacity(opacity);
        break;
      case "decTCI":
        this.decTCILayer.setOpacity(opacity);
        break;
      case "lessee":
        this.lesseeBoundaryLayer.setOpacity(opacity);
    }
  }

}