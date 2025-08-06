
from flask import Flask, jsonify
import requests
import logging

app = Flask(__name__)

GEOSERVER_WFS_URL = (
    "http://localhost:8080/geoserver/pcubedgis/ows"
    "?service=WFS"
    "&version=1.0.0"
    "&request=GetFeature"
    "&typeName=pcubedgis:reportarea_atco"
    "&outputFormat=application/json"
    "&srsName=EPSG:4326"
)

GEOSERVER_WFS_URL_BREADCRUMB = (
    "http://localhost:8080/geoserver/pcubedgis/ows"
    "?service=WFS"
    "&version=1.0.0"
    "&request=GetFeature"
    "&typeName=pcubedgis:breadcrumbsummit"
    "&outputFormat=application/json"
    "&srsName=EPSG:4326"
)

logging.basicConfig(level=logging.INFO)

@app.route('/api/reportarea_atco')
def get_reportarea_atco():
    try:
        r = requests.get(GEOSERVER_WFS_URL)
        r.raise_for_status()
        data = r.json()
        logging.info(f"GeoServer data loaded successfully. Features: {len(data.get('features', []))}")
        return jsonify(data)
    except Exception as e:
        logging.error(f"Error loading GeoServer data: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/breadcrumb_summit')
def get_breadcrumb_summit():
    try:
        r = requests.get(GEOSERVER_WFS_URL_BREADCRUMB)
        r.raise_for_status()
        data = r.json()
        logging.info(f"GeoServer Breadcrumb Summit data loaded successfully. Features: {len(data.get('features', []))}")
        return jsonify(data)
    except Exception as e:
        logging.error(f"Error loading GeoServer data: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
