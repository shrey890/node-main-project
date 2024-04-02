/* eslint-disable */
export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoieDkwIiwiYSI6ImNsdWg1M29hdjBiZ28ya25wM2I4aGpnOGgifQ.TCr6C0QNzXWuoOn64MTPGw';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/x90/cluh56tu901cc01mj6y6f9poc',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};