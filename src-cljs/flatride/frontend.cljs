(ns flatride.frontend
    (:use-macros
        [dommy.macros :only [node sel sel1]])
    (:use [flatride.utils :only [log slope-diff
                                 slope-total-distance]])
    (:require
        [flatride.core :as core]
        [goog.string :as gstring]
        [goog.string.format]
        [dommy.core :as dommy]))


(def gautocomplete-from nil)
(def gautocomplete-to nil)

(defn map-config-obj []
  (js-obj "zoom" 12
          "mapTypeId" window/google.maps.MapTypeId.ROADMAP
          "disableDefaultUI" true
          "center" (window/google.maps.LatLng. 45 45)))

(def stroke-colors ["red" "green" "blue"])

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
                              [:li [:strong "slope %"] (->> longest-slope slope-diff (gstring/format "%.2f"))]
                              [:li [:strong "distance"] (->> longest-slope slope-total-distance (gstring/format "%.2f"))]]]))
    (dommy/append! ul (node [:li [:strong "steepest slope"]
                             [:ul
                              [:li [:strong "slope %"] (->> steepest-slope slope-diff (gstring/format "%.2f"))]
                              [:li [:strong "distance"] (->> steepest-slope slope-total-distance (gstring/format "%.2f"))]]]))))

(defn get-routes []
  (let [from (dommy/value (sel1 :#input-from))
        to (dommy/value (sel1 :#input-to))]
    (core/start-compute-routes from to display-routes display-elevations)))

(defn init-autocomplete []
  (set! gautocomplete-from (window/google.maps.places.Autocomplete. (sel1 :#input-from)))
  (set! gautocomplete-to (window/google.maps.places.Autocomplete. (sel1 :#input-to))))

(def *mapInstance* nil)
(defn init []
  (init-autocomplete)
  (set! *mapInstance* (window/google.maps.Map. (sel1 :#div-map-canvas) (map-config-obj)))
  (dommy/listen! (sel1 :#button-submit) :click get-routes))

(set! (.-onload js/window) init)

