# PCubedPro Mapbox GIS Application

This is a React-based GIS application that uses Mapbox GL JS with OpenStreetMap tiles to display WMS layers from GeoServer.

## Features

- **Mapbox GL JS Integration**: Modern, high-performance mapping library
- **OpenStreetMap Basemap**: Uses OpenStreetMap tiles (no token required)
- **WMS Layer Support**: Displays WMS layers from GeoServer
- **Basemap Switching**: Toggle between OpenStreetMap, Satellite, and Streets basemaps
- **Layer Controls**: Toggle visibility of WMS layers (Report Area ATCO, Breadcrumb ATCO)
- **Feature Info Popup**: Click on features to get detailed information
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- GeoServer running on localhost:8080

## Installation

1. Clone or navigate to the project directory:
   ```bash
   cd pcubedpro_mapbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Configuration

### GeoServer WMS URLs

The application is configured to use these WMS layers:
- Report Area ATCO: `pcubedgis:reportarea_atco`
- Breadcrumb ATCO: `pcubedgis:breadcrumb_atco`

To modify the WMS URLs, update the `wmsUrls` object in `src/App.js`.

## Usage

### Layer Controls
- **Report Area ATCO**: Toggle the report area layer visibility
- **Breadcrumb ATCO**: Toggle the breadcrumb layer visibility
- Only one layer can be active at a time

### Basemap Gallery
- **OpenStreetMap**: Standard OpenStreetMap tiles (default)
- **Satellite**: Esri World Imagery
- **Streets**: Esri World Street Map

### Feature Information
- Click on any feature in an active WMS layer to view detailed information
- A popup will appear with feature attributes
- Click the × button to close the popup

## Project Structure

```
pcubedpro_mapbox/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Application styles
│   ├── index.js        # React entry point
│   └── index.css       # Global styles
├── package.json
└── README.md
```

## Key Differences from OpenLayers Version

1. **Mapping Library**: Uses Mapbox GL JS instead of OpenLayers
2. **Basemap**: Uses OpenStreetMap tiles instead of Mapbox styles
3. **WMS Implementation**: WMS layers are implemented as raster sources
4. **Performance**: Better performance for large datasets
5. **Styling**: Modern, clean UI with improved styling
6. **Mobile Support**: Better touch interaction and responsive design

## Troubleshooting

### WMS Layer Not Loading
- Verify GeoServer is running on localhost:8080
- Check that the WMS layers exist in GeoServer
- Ensure CORS is properly configured

### Feature Info Not Working
- Verify the WMS layers support GetFeatureInfo
- Check browser console for CORS errors
- Ensure the layer is visible before clicking

### Basemap Not Loading
- Check your internet connection
- OpenStreetMap tiles require internet access
- Satellite and Streets layers use Esri services

## Development

### Adding New WMS Layers

1. Add the WMS URL to the `wmsUrls` object in `App.js`
2. Add a new layer source and layer in the `useEffect` hook
3. Add a checkbox control in the layer controls section
4. Update the `activeLayers` state

### Customizing Styles

Modify `src/App.css` to customize the appearance of:
- Layer control panels
- Basemap gallery
- Feature info popup
- Responsive design

## License

This project is part of the PCubedPro GIS suite. 