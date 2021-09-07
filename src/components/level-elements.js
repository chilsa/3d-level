import React, {useEffect, useState, Fragment} from 'react';
import mapboxgl from 'mapbox-gl';
import turfLineToPolygon from '@turf/line-to-polygon';
import turfLineOffset from '@turf/line-offset';
import {lineString as turfLineString} from '@turf/helpers';
import {getCoords as turfGetCoords} from '@turf/invariant';
import {reverse as _reverse, includes as _includes} from 'lodash';
import geojson from '../featuresOfKowloonEastGovernmentOffices_GF';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hpbHNhIiwiYSI6ImNrczhjcjJqYjB4Y3YybmxoZXF4MGxpN2IifQ.MCk1P9kZx-xxYmF1Ne6IlQ';
/*

// remove the windows, gates, and point
let polygonFeatures = geojson.features.filter(f => f.geometry.type === 'Polygon');
// add BaseLevel, Height, Color to polygons, coordinates wrapped in []
polygonFeatures = polygonFeatures.map(f => {
	const obj = {...f};
	obj.properties.Height = '4.57';
	obj.properties.BaseLevel = '7.2';
	//obj.properties.Color = getRandomColor();
	obj.geometry.coordinates = [[...f.geometry.coordinates]];
	return obj;
});
*/
const gate1 = {
	"type": "Feature",
	"properties": {
		"gate": "yes",
		"id": "922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_gate_179",
		"imdf_id": "c6b69d3d-4810-4670-89d3-3b102a2dc680",
		"ref:building": "922674f34fc04a9088afcd3925d8e9ae",
		"ref:level": "791abf1f98774034be2ff9701738921e",
		"ref:unit": "922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_unit_135,922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_connector_21"
	},
	"geometry": {
		"coordinates": [
			[
				114.2298052,
				22.3094233
			],
			[
				114.2298098,
				22.3094295
			],
			[
				114.2298148,
				22.3094362
			]
		],
		"type": "LineString"
	}
};
const gate2 = {
	"type": "Feature",
	"properties": {
		"gate": "yes",
		"id": "922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_gate_177",
		"imdf_id": "493d4b83-8131-462e-9cd1-88c9c7237521",
		"ref:building": "922674f34fc04a9088afcd3925d8e9ae",
		"ref:level": "791abf1f98774034be2ff9701738921e",
		"ref:unit": "922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_unit_132,922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_connector_20"
	},
	"geometry": {
		"coordinates": [
			[
				114.229849,
				22.3094334
			],
			[
				114.2298557,
				22.3094291
			],
			[
				114.2298652,
				22.309423
			]
		],
		"type": "LineString"
	}
};
const brokenLine = turfLineString([[114.2298921, 22.3094855], [114.229914, 22.3094716], [114.2299002, 22.3094534]]);

const features = geojson.features,
	refUnits = gate2.properties['ref:unit'].split(','),
	gate2RefUnits = features.filter(f => f.properties.unit && _includes(refUnits, f.properties.id));
console.log(gate2RefUnits);


const p1 = lineToPolygon(gate1);
const p2 = lineToPolygon(gate2);
const p3 = lineToPolygon(brokenLine);

function lineToPolygon(lineFeature) {
	const leftOffset = turfLineOffset(lineFeature, -0.15, {units: 'meters'}),
		rightOffset = turfLineOffset(lineFeature, 0.15, {units: 'meters'}),
		combineLine = turfLineString(
			turfGetCoords(leftOffset).concat(_reverse(turfGetCoords(rightOffset)))
		);
	return turfLineToPolygon(combineLine);
}


function getRandomColor() {
	return `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},1)`;
}

function addSource(map, id, data) {
	map.addSource(id, {
		type: 'geojson',
		data: {
			type: data.type,
			geometry: data.geometry
		}
	})
}

function initMapbox() {
	return new mapboxgl.Map({
		style: 'mapbox://styles/mapbox/streets-v11',
		center: [114.22980247477426, 22.310013597985446],
		zoom: 18.5,
		pitch: 60,
		container: 'map'
	});
}

export default function LevelElements() {
	useEffect(() => {
		const map = initMapbox();
		map.on('load', () => {
			// lines
			addSource(map, gate1.properties.id, gate1);
			map.addLayer({
				id: gate1.properties.id,
				type: 'line',
				source: gate1.properties.id,
				paint: {
					"line-color": "blue",
					"line-width": 2
				}
			});
			
			addSource(map, gate2.properties.id, gate2);
			map.addLayer({
				id: gate2.properties.id,
				type: 'line',
				source: gate2.properties.id,
				paint: {
					"line-color": "green",
					"line-width": 2
				}
			});
			
			addSource(map, 'broken-line', brokenLine);
			map.addLayer({
				id: 'broken-line',
				type: 'line',
				source: 'broken-line',
				paint: {
					"line-color": "purple",
					"line-width": 2
				}
			});

			// polygons
			map.addLayer({
				id: 'lineToPolygon1',
				type: 'fill',
				source: {
					type: 'geojson',
					data: p1
				},
				'paint': {
					'fill-color': 'red',
					'fill-opacity': 0.5
				}
			});
			map.addLayer({
				id: 'lineToPolygon2',
				type: 'fill',
				source: {
					type: 'geojson',
					data: p2
				},
				'paint': {
					'fill-color': 'yellow',
					'fill-opacity': 0.5
				}
			});
			map.addLayer({
				id: 'lineToPolygon3',
				type: 'fill',
				source: {
					type: 'geojson',
					data: p3
				},
				'paint': {
					'fill-color': 'orange',
					'fill-opacity': 0.5
				}
			});
		});
	}, []);
	
	return <div id='map'/>
}
