import React, {useEffect, useState, Fragment} from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hpbHNhIiwiYSI6ImNrczhjcjJqYjB4Y3YybmxoZXF4MGxpN2IifQ.MCk1P9kZx-xxYmF1Ne6IlQ';

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
		initMapbox();
	}, []);
	
	return <div id='map'/>
}
