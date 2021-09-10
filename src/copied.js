import React, {useEffect} from 'react';
import mapboxgl from 'mapbox-gl';
import turfLineToPolygon from '@turf/line-to-polygon';
import turfLineOffset from '@turf/line-offset';
import {lineString as turfLineString, point as turfPoint} from '@turf/helpers';
import {getCoords as turfGetCoords} from '@turf/invariant';
import turfNearestPointOnLine from '@turf/nearest-point-on-line';
import turfLineSplit from '@turf/line-split';
import {featureEach as turfFeatureEach} from '@turf/meta';
import {
	reverse as _reverse,
	map as _map,
	filter as _filter,
	flatten as _flatten,
	forEach as _forEach,
	isEqual as _isEqual,
	isEqualWith as _isEqualWith,
	some as _some
} from 'lodash';
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

const features = geojson.features;
// polygon to lines
const unit = {
	"type": "Feature",
	"properties": {
		"ref:poi": "922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_poi:unit_99",
		"area": "yes",
		"BaseLevel": "7.2",
		"Creation_by": "03",
		"CreationDate": "10/11/2020",
		"id": "922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_unit_121",
		"imdf_id": "2abcb199-3b15-4ccc-9d84-c9317a185cb6",
		"LastAmendment_by": "03",
		"LastAmendmentDate": "13/07/2021 11:46:36",
		"ref:building": "922674f34fc04a9088afcd3925d8e9ae",
		"ref:level": "791abf1f98774034be2ff9701738921e",
		"Restricted": "N",
		"True3DSDModelID": "1B41725189540106011",
		"TrueBuildingCSUID": "4172518954T20050430",
		"unit": "room",
		"Unit_Number": "0102",
		"UnitSubtype": "09-01"
	},
	"geometry": {
		"coordinates": [[
			[
				114.2299791,
				22.3096146
			],
			[
				114.2299892,
				22.3096081
			],
			[
				114.2299913,
				22.309611
			],
			[
				114.2300186,
				22.3095934
			],
			[
				114.2300166,
				22.3095907
			],
			[
				114.2300284,
				22.3095831
			],
			[
				114.2300198,
				22.3095708
			],
			[
				114.2299846,
				22.3095935
			],
			[
				114.2299784,
				22.3095853
			],
			[
				114.2299641,
				22.3095946
			],
			[
				114.2299791,
				22.3096146
			]
		]],
		"type": "Polygon"
	}
};
const unitGates = geojson.features.filter(f => {
	return f.properties.gate === 'yes'
		&& f.properties['ref:unit']?.split(',')?.includes(unit.properties.id)
});
//let lines = splitUnitByGates(unit, unitGates);

/*
let lines = splitUnitByGates(unit, unitGates);
lines = _map(lines, l => lineToPolygon(l));
*/

let units = [];
let gates = [];
_forEach(features, f => {
	if (f.properties?.unit) {
		units.push(f);
	}
	if (f.properties.gate === 'yes') {
		gates.push(f);
	}
});

let obj;
const data = _map(units, u => {
	obj = {...u};
	obj.properties.Height = '4.57';
	return {
		unit: obj,
		gates: _filter(gates, g => g.properties['ref:unit'].split(',').includes(u.properties.id))
	}
});

let unitHasGates = [];
let unitHasNoGates = [];
_forEach(data, d => {
	if (d.gates.length) {
		unitHasGates.push(d);
	} else {
		unitHasNoGates.push(d.unit);
	}
});

const splitsArr = _map(unitHasGates, d => splitUnitByGates(d.unit, d.gates));
const splits = _flatten(splitsArr);
const _lines = _map(splits, sp => lineToPolygon(sp));

// return split points(feature) on the unit
function getSplitters(unit, gates) {
	let coords = [];
	// get gates start-end points array
	const gateStartEndPoints = _map(gates, g => {
		coords = turfGetCoords(g);
		return _filter(coords, (c, index) => !index || index === coords.length - 1);
	});
	// switch unit to line
	const unitToLine = turfLineString(turfGetCoords(unit));
	// get the nearest points array of the gates start-end points on the line
	let pt;
	return _map(gateStartEndPoints, locs => {
		return _map(locs, loc => {
			pt = turfPoint(loc);
			return turfNearestPointOnLine(unitToLine, pt);
		})
	});
}

// return split lines features
function splitUnitByGates(unit, gates) {
	const splitters = getSplitters(unit, gates);
	const unitToLine = turfLineString(turfGetCoords(unit));
	let lines = [];
	let split;
	let copies;
	_forEach(_flatten(splitters), p => {
		if (lines.length) {
			copies = [...lines];
			lines = [];
			_forEach(copies, f => {
				split = turfLineSplit(f, p);
				turfFeatureEach(split, f => lines = [...lines, f]);
			});
		} else {
			split = turfLineSplit(unitToLine, p);
			turfFeatureEach(split, f => lines.push(f));
		}
	});
	return lines;
	/*	let coords;
		const splitterCoords = _map(splitters, features => _map(features, f => turfGetCoords(f)));
		let linesTakeoffGates = _filter(lines, f => {
			coords = turfGetCoords(f);
			return !_some(splitterCoords, elm => {
				return _isEqualWith(elm, coords, (elmV, coordsV) => {
					return _isEqual(elmV, coordsV) || _isEqual(elmV, _reverse(coordsV));
				})
			});
		});
		// add unit properties to split lines
		linesTakeoffGates = _map(linesTakeoffGates, f => ({...f, properties: unit.properties}));
		
		return linesTakeoffGates;*/
}

function lineToPolygon(lineFeature) {
	const leftOffset = turfLineOffset(lineFeature, -0.15, {units: 'meters'}),
		rightOffset = turfLineOffset(lineFeature, 0.15, {units: 'meters'}),
		combineLine = turfLineString(
			turfGetCoords(leftOffset).concat(_reverse(turfGetCoords(rightOffset)))
		);
	try {
		return turfLineToPolygon(combineLine);
	} catch (e) {
		console.log(lineFeature, combineLine);
	}
}

// -------
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
			map.addLayer({
				id: 'lineToPolygon3',
				type: 'fill-extrusion',
				source: {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: _lines
					}
				},
				'paint': {
					'fill-extrusion-color': '#aaa',
					'fill-extrusion-height': 4,
					'fill-extrusion-base': ['to-number', ['get', 'BaseLevel']],
					'fill-extrusion-opacity': 0.5
				}
			});
			
			/*map.addLayer({
				id: 'area',
				type: 'fill',
				source: {
					type: 'geojson',
					data: unit
				},
				paint: {
					"fill-color": "#aaa"
				}
			})*/
			
			
			/*map.addLayer({
				id:'tttt',
				type:'line',
				source: {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: lines
					}
				},
				paint: {
					"line-color": "#888",
					"line-width": 3
				}
			})*/
		});
	}, []);
	
	return <div id='map'/>
}
