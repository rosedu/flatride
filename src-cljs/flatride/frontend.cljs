(ns flatride.frontend
    (:use-macros
        [dommy.macros :only [node sel sel1]])
    (:use [flatride.utils :only [log slope-diff
                                 slope-total-distance
                                 slope-percent]])
    (:require
        [flatride.core :as core]
        [goog.string :as gstring]
        [goog.string.format]
        [dommy.core :as dommy]))

(def gautocomplete-from nil)
(def gautocomplete-to nil)
(def *mapInstance* nil)

(defn map-config-obj [latlng]
  (js-obj "zoom" 14
          "mapTypeId" window/google.maps.MapTypeId.ROADMAP
          "disableDefaultUI" true
          "center" latlng))

(def stroke-colors ["red" "green" "blue" "yellow" "purple"])

(defn display-routes [routes-data]
  (doseq [route (:routes-data routes-data)]
    (dommy/append! (sel1 :#div-routes-display)
                   (node [:div.route-data
                          [:ul.route-card
                           [:li [:strong "distance"] (:distance route)]
                           [:li [:strong "duration"] (:duration route)]]])))

  ; plot the directions on the map
  (doseq [idx (range (->> (:to-display routes-data) .-routes .-length))]
    (let [directionsDisplay (window/google.maps.DirectionsRenderer.
            (js-obj "polylineOptions" (js-obj "strokeColor" (stroke-colors idx))))]
      (.setMap directionsDisplay *mapInstance*)
      (.setDirections directionsDisplay (:to-display routes-data))
      (.setRouteIndex directionsDisplay idx))))

(defn display-elevations [{idx :idx
                           longest-slope :longest-slope
                           steepest-slope :steepest-slope}]
  (let [ul (nth (sel :ul.route-card) idx)]
    (dommy/append! ul (node [:li [:strong "longest slope"]
                             [:ul
                              [:li [:strong "slope"] (->> longest-slope slope-percent (gstring/format "%.2f%%"))]
                              [:li [:strong "distance"] (->> longest-slope slope-total-distance (gstring/format "%.2f"))]]]))
    (dommy/append! ul (node [:li [:strong "steepest slope"]
                             [:ul
                              [:li [:strong "slope"] (->> steepest-slope slope-percent (gstring/format "%.2f%%"))]
                              [:li [:strong "distance"] (->> steepest-slope slope-total-distance (gstring/format "%.2f"))]]]))))

(defn get-routes []
  (let [from (dommy/value (sel1 :#input-from))
        to (dommy/value (sel1 :#input-to))]
    (doall (map dommy/remove! (sel :div.route-data)))
    (core/start-compute-routes from to display-routes display-elevations :bike)))

(defn init-autocomplete []
  (set! gautocomplete-from (window/google.maps.places.Autocomplete. (sel1 :#input-from)))
  (set! gautocomplete-to (window/google.maps.places.Autocomplete. (sel1 :#input-to))))

(defn fill-from-field [results status]
  "Fill input from field with human readable address"
  (if (= status js/window.google.maps.GeocoderStatus.OK)
    (dommy/set-value! (sel1 :#input-from) (.-formatted_address (nth results 1)))
    (dommy/set-value! (sel1 :#input-from) "Type in your location")))

(defn reverse-geocode [coords]
  "Convert geolocation coords to human readable"
  (let [lat (->> coords .-coords .-latitude)
        lng (->> coords .-coords .-longitude)
        geocoder (js/window.google.maps.Geocoder.)
        latlng (js/window.google.maps.LatLng. lat lng)]
  (set! *mapInstance* (window/google.maps.Map. (sel1 :#div-map-canvas) (map-config-obj latlng)))    
    (.geocode geocoder (js-obj "latLng" latlng) fill-from-field)))

(defn init-current-position []
  "Get user current location for the _from_ field"
  (.getCurrentPosition js/navigator.geolocation reverse-geocode))


(defn init []
  (init-autocomplete)
  (dommy/listen! (sel1 :#button-submit) :click get-routes)
  (init-current-position))

(set! (.-onload js/window) init)

