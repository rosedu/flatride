(ns flatride.frontend
    (:use-macros
        [dommy.macros :only [node sel sel1]])
    (:use [flatride.utils :only [log slope-diff]])
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
          "center" (window/google.maps.LatLng. 45 45)))

(def stroke-colors ["red" "green" "blue"])

(defn display-routes [routes-data]
  (doseq [route (:routes-data routes-data)]
    (dommy/append! (sel1 :#div-routes-display)
                   (node [:div.routeData
                          [:p (:duration route)]
                          [:p (:distance route)]])))

  ; plot the directions on the map
  (doseq [idx (range (->> (:to-display routes-data) .-routes .-length))]
    (let [directionsDisplay (window/google.maps.DirectionsRenderer.
            (js-obj "polylineOptions" (js-obj "strokeColor" (stroke-colors idx))))]
      (.setMap directionsDisplay *mapInstance*)
      (.setDirections directionsDisplay (:to-display routes-data))
      (.setRouteIndex directionsDisplay idx))))

(defn get-routes []
  (let [from (dommy/value (sel1 :#input-from))
        to (dommy/value (sel1 :#input-to))]
    (core/start-compute-routes from to display-routes)))

(defn init-autocomplete []
  (set! gautocomplete-from (window/google.maps.places.Autocomplete. (sel1 :#input-from)))
  (set! gautocomplete-to (window/google.maps.places.Autocomplete. (sel1 :#input-to))))

(def *mapInstance* nil)
(defn init []
  (init-autocomplete)
  (set! *mapInstance* (window/google.maps.Map. (sel1 :#div-map-canvas) (map-config-obj)))
  (dommy/listen! (sel1 :#button-submit) :click get-routes)
  )

(set! (.-onload js/window) init)

