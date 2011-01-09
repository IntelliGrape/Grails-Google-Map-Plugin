/**
 * @name Google Map Plugin Utility
 * @author Bhagwat Kumar
 */
var ig_mapConfiguration = {};
var geoCoder;
var directionService;
var streetViewService;

var directionRenderer;

function ig_mapInit(ig_mapDiv, configurationForMap, showHomeMarker, latitudeId, longitudeId) {
	var igGoogleMap = new google.maps.Map(document.getElementById(ig_mapDiv), configurationForMap);
	var homeMarker;
	ig_mapConfiguration[igGoogleMap] = new Object();
	ig_mapConfiguration[igGoogleMap].markerManager = null;

	homeMarker = ig_createMarker(igGoogleMap, configurationForMap['center']);

	if (!showHomeMarker) {
		homeMarker.setVisible(false);
	}
	ig_mapConfiguration[igGoogleMap].infoWindow = new google.maps.InfoWindow({
		content:"",
		size: new google.maps.Size(100, 150)
	});

	var latitudeDom = jQuery("#" + latitudeId);
	var longitudeDom = jQuery("#" + longitudeId);

	if (latitudeDom.length || longitudeDom.length) {
		google.maps.event.addListener(homeMarker, 'position_changed', function() {
			var latLng = homeMarker.getPosition();
			jQuery("#" + latitudeId).val(latLng.lat());
			jQuery("#" + longitudeId).val(latLng.lng());
		});
	}

	/*
	 var panorama= igGoogleMap.getStreetView();

	 google.maps.event.addListener(panorama, 'pov_changed', function() {
	 updatePovDataAndPano(panorama.getPov(), panorama.getPano());
	 });

	 google.maps.event.addListener(panorama, 'pano_changed', function() {
	 updatePanoId(panorama.getPano());
	 });
	 */

	ig_mapConfiguration[igGoogleMap].homeMarker = homeMarker;

	return igGoogleMap;
}

function ig_initAutoComplete(inputSelector, settings, callback) {
	jQuery(inputSelector).geo_autocomplete(ig_getGeoCoder(), settings).result(function(_event, _data) {
		if (callback) {
			callback(_event, _data);
		}
	});
}

function ig_getGeoCoder() {
	if (!geoCoder) {
		geoCoder = new google.maps.Geocoder();
	}
	return geoCoder;
}

function ig_getDirectionService() {
	if (!directionService) {
		directionService = new google.maps.DirectionsService();
	}
	return directionService;
}

function ig_getDirectionRenderer(map) {
	if (!ig_mapConfiguration[map].directionRenderer) {
		ig_mapConfiguration[map].directionRenderer = new google.maps.DirectionsRenderer();
	}
	return ig_mapConfiguration[map].directionRenderer;
}

function ig_getStreetViewService() {
	if (!streetViewService) {
		streetViewService = new google.maps.StreetViewService();
	}
	return streetViewService;
}

function ig_createMarker(map, position) {
	return new google.maps.Marker({map: map, position: position, draggable:true});
}

function ig_updateHomeLocationMarker(map, address) {
	addressLookUp = ig_getGeoCoder();
	addressLookUp.geocode({'address': address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				ig_mapConfiguration[map].homeMarker.setPosition(results[0].geometry.location);
				map.setCenter(results[0].geometry.location);
			} else {
				alert("No result found");
			}
		} else {
			alert("GeoCoding failed : " + status);
		}
	});

}
function getTravelMode(travelModeDomId) {
	var travelModeValue = jQuery('#'+travelModeDomId).val();
	if (travelModeValue == 'google.maps.DirectionsTravelMode.DRIVING') {
		travelModeValue = google.maps.DirectionsTravelMode.DRIVING;
	} else if (travelModeValue == 'google.maps.DirectionsTravelMode.BICYCLING') {
		travelModeValue = google.maps.DirectionsTravelMode.BICYCLING;
	} else if (travelModeValue == 'google.maps.DirectionsTravelMode.WALKING') {
		travelModeValue = google.maps.DirectionsTravelMode.WALKING;
	} else {
		travelModeValue = google.maps.DirectionsTravelMode.WALKING; //Default Mode
	}
	return travelModeValue;
}

function getUnitSystemMode(unitSystemModeDomId) {
	var unitSystemModeValue = jQuery('#'+unitSystemModeDomId).val();
	if (unitSystemModeValue == 'google.maps.DirectionsUnitSystem.IMPERIAL') {
		unitSystemModeValue = google.maps.DirectionsUnitSystem.IMPERIAL;
	} else {
		unitSystemModeValue = google.maps.DirectionsUnitSystem.METRIC; //Default Mode
	}
	return unitSystemModeValue;
}

function directionSearchHandler(map, directionDiv,originDomId, destinationDomId, travelModeDomId, unitSystemDomId, avoidHighways, avoidTolls){
	var origin = jQuery('#'+originDomId).val();
	var destination = jQuery('#'+destinationDomId).val();
	var travelMode=getTravelMode(travelModeDomId);
	var unitSystem=getUnitSystemMode(unitSystemDomId);
	showDirectionHandler(map, directionDiv, origin, destination, travelMode, unitSystem, avoidHighways, avoidTolls);
}

function showDirectionHandler( map, directionDiv, origin, destination, travelMode, unitSystem, avoidHighways, avoidTolls) {
	var request = {
		origin:origin,
		destination:destination,
		travelMode: travelMode,
		unitSystem:unitSystem,
		avoidHighways:avoidHighways,
		avoidTolls:avoidTolls
	};
	directionService = ig_getDirectionService();
	directionService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			var directionRenderer = ig_getDirectionRenderer(map);
			if (directionDiv) {
				directionRenderer.setPanel(document.getElementById(directionDiv));
			}
			directionRenderer.setMap(map);
			directionRenderer.setDirections(response);
		} else {
			alert("Failed to get direction");
		}
	});
}

function ig_showStreetView(address, map) {
	ig_codeLatLng(address, function(results) {
		var latLng = results[0].geometry.location;
		var sv = ig_getStreetViewService();
		sv.getPanoramaByLocation(latLng, 50, function(data, status) {
			if (status == google.maps.StreetViewStatus.OK) {
				var markerPanoID = data.location.pano;
				panorama = map.getStreetView();
				panorama.setPano(markerPanoID);
				panorama.setPov({
					heading: 270,
					pitch: 0,
					zoom: 1
				});
				panorama.setVisible(true);
			} else {
				alert("No street view available for this location")
			}
		});

	});
}

function ig_codeLatLng(address, callBackFunction) {
	var addressLookup = ig_getGeoCoder();
	if (addressLookup) {
		addressLookup.geocode({'address': address}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				callBackFunction(results);
			} else {
				alert("Failed to geoCode for : " + address + " Status : " + status);
			}
		});
	}
}

function ig_hideDirection(map, directionDiv) {
	ig_mapConfiguration[map].directionRenderer.setMap(null)
	jQuery('#' + directionDiv).empty();
}

function ig_hideStreetView(map, streetViewDiv) {
	var panorama = map.getStreetView();
	if (panorama) {
		panorama.setVisible(false);
	}
	jQuery('#' + streetViewDiv).empty();
}

function getMarkerManager(map) {
	var markerManager = ig_mapConfiguration[map].markerManager;
	if (!markerManager) {
		markerManager = new MarkerManager(map);
		ig_mapConfiguration[map].markerManager = markerManager;
	}
	return markerManager;
}

function ig_updateMarkersOnMap(map, markers, clearOld) {
	markerManager = getMarkerManager(map);
	if (clearOld) {
		markerManager.clearMarkers();
	}

	var markersArrayToBeAddedToClusterer = [];
	jQuery(markers).each(function(key, markerInfo) {
		var configuration = {};
//		configuration.map = map;
		configuration.position = new google.maps.LatLng(markerInfo["latitude"], markerInfo["longitude"]);
		var propertiesList = ["zIndex",	"draggable", "visible", "title", "icon", "shadow", "clickable", "flat", "cursor","raiseOnDrag", "content"]
		jQuery.each(propertiesList, function(index, property) {
			if (typeof markerInfo[property] != 'undefined') {
				configuration[property] = markerInfo[property]
			}
		});

		var marker = new google.maps.Marker(configuration);
		var infoWindow = ig_mapConfiguration[map].infoWindow;

		google.maps.event.addListener(marker, 'click', function(event) {
			infoWindow.close();
			if (typeof markerInfo["clickHandler"] != 'undefined') {
				(markerInfo["clickHandler"])(map, event);
			} else {
				infoWindow.setContent(markerInfo.content)
				infoWindow.open(map, marker);
			}
		});
		markersArrayToBeAddedToClusterer.push(marker);
	});

	markerManager.addMarkers(markersArrayToBeAddedToClusterer);
}

/*
 function updatePovData(pov) {
 jQuery('#pov-heading').val(pov.heading);
 jQuery('#pov-pitch').val(pov.pitch);
 jQuery('#pov-zoom').val(pov.zoom);
 }

 function updatePanoId(panoId) {
 jQuery('#pov-panoId').val(panoId);
 }
 */

function MarkerManager(m) {
	var markers_array;
	var map = m;
	return {
		getMap : function() {
			return map;
		},
		addMarkers : function(temp_markers_array) {
			if (!markers_array) {
				markers_array = new Array();
			}
			for (counter = 0; counter<temp_markers_array.length; counter++) {
				var marker = temp_markers_array[counter];
				marker.setMap(map);
				markers_array.push(marker);
			}
			return markers_array;
		},
		clearMarkers : function() {
			if (markers_array) {
				for (counter = 0; counter<markers_array.length; counter++) {
					var marker = markers_array[counter];
					marker.setMap(null)
				}
			}
			markers_array = null;
		},
		findMarker : function(lat, lng) {
			var marker = null;
			if (markers_array) {
				for (counter = 0; counter<markers_array.length; counter++) {
					var temp_marker = markers_array[counter];
					if (temp_marker.lat() == lat && temp_marker.lng() == lng) {
						marker = temp_marker;
						break;
					}
				}
			}
			return marker;
		},
		setVisible:function(isVisible){
			for (counter = 0; counter<markers_array.length; counter++) {
				markers_array[counter].setVisible(isVisible)
			}
		} ,
		getMarkers : function() {
			return markers_array;
		},
		getMarkersCount : function() {
			return markers_array.length || 0;
		}
	};
}