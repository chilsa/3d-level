import React, {useEffect} from 'react';
import mapboxgl from 'mapbox-gl';
import data from '../fixedData';
import {lineString as turfLineString, point as turfPoint} from '@turf/helpers';
import {getCoords as turfGetCoords} from '@turf/invariant';
import {polygonToLine as turfPolygonToLine} from '@turf/polygon-to-line';
import {featureEach as turfFeatureEach} from '@turf/meta';
import turfNearestPointOnLine from "@turf/nearest-point-on-line";
import turfLineSplit from '@turf/line-split';
import turfCleanCoords from '@turf/clean-coords';
import turfLineOffset from '@turf/line-offset';
import turfLineToPolygon from '@turf/line-to-polygon';
import {
	find as _find,
	filter as _filter,
	last as _last,
	map as _map,
	assign as _assign,
	flatten as _flatten,
	forEach as _forEach,
	some as _some,
	isEqual as _isEqual,
	isEqualWith as _isEqualWith,
	reverse as _reverse,
	round as _round,
	slice as _slice
} from 'lodash';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hpbHNhIiwiYSI6ImNrczhjcjJqYjB4Y3YybmxoZXF4MGxpN2IifQ.MCk1P9kZx-xxYmF1Ne6IlQ';

const units = data.units;
const gates = data.gates;

const testId = '922674f34fc04a9088afcd3925d8e9ae_791abf1f98774034be2ff9701738921e_unit_121';
const unit = _find(units, u => u.properties.id === testId);
const unitGates = getUnitGates(unit, gates);
const trimUnitGates = _map(unitGates, g => {
	return _assign(
		{},
		g,
		{
			geometry: {
				...g.geometry,
				coordinates: cleanCoords(g.geometry.coordinates)
			}
		}
	)
});
const splitterPairs = getSplitterPairsOnLine(unit, trimUnitGates);
const splitLines = getSplitLines(unit, splitterPairs);
const combinedLines = connectLines(splitLines);
const linesToPolygon = _map(combinedLines, f => lineToPolygon(f));

// split line by points
function getSplitLines(unit, splitterPairs) {
	const unitToLine = turfPolygonToLine(unit);
	let lines = [];
	let split;
	let copies;
	_forEach(_flatten(splitterPairs), pf => {
		if (lines.length) {
			copies = [...lines];
			lines = [];
			_forEach(copies, feature => {
				split = turfLineSplit(feature, pf);
				turfFeatureEach(split, lf => lines = [...lines, lf]);
			});
		} else {
			split = turfLineSplit(unitToLine, pf);
			turfFeatureEach(split, lf => lines.push(lf));
		}
	});
	// remove duplicate coordinates of the lines
	lines = _map(lines, l => turfCleanCoords(l));
	// take off the gates
	lines = takeOffLines(lines, splitterPairs);
	// add unit properties to split lines
	lines = _map(lines, f => ({...f, properties: unit.properties}));
	return lines;
}

// convert line into polygon
function lineToPolygon(lineFeature) {
	const leftOffset = turfLineOffset(lineFeature, -0.15, {units: 'meters'});
	const rightOffset = turfLineOffset(lineFeature, 0.15, {units: 'meters'});
	const combineLine = turfLineString(
		turfGetCoords(leftOffset).concat(_reverse(turfGetCoords(rightOffset)))
	);
	try {
		return turfLineToPolygon(combineLine);
	} catch (e) {
		console.error('turf lineToPolygon goes wrong!');
		console.log('origin: ', lineFeature);
		console.log('result: ', combineLine);
	}
}

// connect the first and last line
function connectLines(lines) {
	let target, first, firstCoords, last, combined;
	for (let i = 0; i < lines.length; i++) {
		firstCoords = turfGetCoords(lines[i]);
		target = _find(
			lines,
			l => _isEqual(turfGetCoords(l)[0], _last(firstCoords))
		);
		if (target) {
			first = lines[i];
			last = target;
			break;
		}
	}
	combined = _assign(
		{},
		first,
		{
			geometry: {
				...first.geometry,
				coordinates: firstCoords.concat(_slice(turfGetCoords(target), 1))
			}
		}
	);
	
	return _filter(lines, l => {
		return !_isEqual(l.geometry.coordinates, first.geometry.coordinates) &&
			!_isEqual(l.geometry.coordinates, last.geometry.coordinates)
	}).concat(combined);
}

// take off the gates from split lines
function takeOffLines(lines, splitterPairs) {
	const coordsArr = _map(splitterPairs, pair => _map(pair, f => turfGetCoords(f)));
	let coords;
	let clean;
	return _filter(lines, f => {
		coords = turfGetCoords(f);
		return !_some(coordsArr, elm => {
			return _isEqualWith(elm, coords, (elmV, coordsV) => {
				clean = cleanCoords(coordsV);
				return _isEqual(elmV, clean) || _isEqual(_reverse(elmV), clean);
			})
		});
	});
}

// return the nearest points(feature pairs) on the unit line of the gates
function getSplitterPairsOnLine(unit, trimGates) {
	const unitToLine = turfPolygonToLine(unit);
	let points = [];
	let feature;
	return _map(trimGates, g => {
		points = _map(turfGetCoords(g), loc => turfPoint(loc));
		return _map(points, point => {
			feature = turfNearestPointOnLine(unitToLine, point);
			feature.geometry.coordinates = _map(feature.geometry.coordinates, loc => _round(loc, 7));
			return feature;
		})
	});
}

// return all gates which are refer to the unit
function getUnitGates(unit, allGates) {
	return _filter(allGates, g => g.properties['ref:unit'].split(',').includes(unit.properties.id));
}

// return a coordsArray which is just made up of a start-coordinate and an end-coordinate
function cleanCoords(coordsArr) {
	return coordsArr.length > 2
		? [coordsArr[0], _last(coordsArr)]
		: coordsArr
}

function getRandomColor() {
	return `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},1)`;
}

function initMapbox() {
	return new mapboxgl.Map({
		style: 'mapbox://styles/mapbox/streets-v11',
		//center: [114.22980247477426, 22.310013597985446],
		center: [114.22998872247331, 22.309601664596073],
		//zoom: 18.5,
		zoom: 22,
		pitch: 60,
		container: 'map'
	});
}

export default function LevelElements() {
	
	useEffect(() => {
		const map = initMapbox();
		map.on('load', () => {
			/*map.addLayer({
				id: 'units',
				type: 'fill',
				source: {
					type: 'geojson',
					data: unit
				},
				paint: {
					'fill-color': 'red'
				}
			});*/
			
			/*map.addLayer({
				id: 'gates',
				type: 'line',
				source: {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: splitLines
					}
				},
				paint: {
					'line-color': '#aaa',
					'line-width': 2
				}
			});*/
			
			/*map.addLayer({
				id: 'splitters',
				type: 'circle',
				source: {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: _flatten(splitterPairs)
					}
				},
				paint: {
					'circle-color': 'blue'
				}
			})*/
			
			map.addLayer({
				id: 'lineToPolygon3',
				type: 'fill-extrusion',
				source: {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: linesToPolygon
					}
				},
				'paint': {
					'fill-extrusion-color': '#aaa',
					'fill-extrusion-height': 4,
					'fill-extrusion-base': ['to-number', ['get', 'BaseLevel']],
					'fill-extrusion-opacity': 0.5
				}
			});
		});
	}, []);
	
	return <div id='map'/>
}
