(ns flatride.frontend
    (:use-macros
        [dommy.macros :only [node sel sel1]])
    (:require
        [dommy.core :as dommy]
        [flatride.core :as core]))

(defn log [stuff]
  (.log js/console stuff))

(def gautocomplete-from nil)
(def gautocomplete-to nil)

(defn map-config-obj []
  (js-obj "zoom" 12
          "mapTypeId" window/google.maps.MapTypeId.ROADMAP
          "center" (window/google.maps.LatLng. 45 45)))

(defn get-routes []
  (let [from (dommy/value (sel1 :#input-from))
        to (dommy/value (sel1 :#input-to))]
    (core/compute-routes from to)))

(defn init-autocomplete []
  (set! gautocomplete-from (window/google.maps.places.Autocomplete. (sel1 :#input-from)))
  (set! gautocomplete-to (window/google.maps.places.Autocomplete. (sel1 :#input-to))))

(defn init []
  (init-autocomplete)
  (window/google.maps.Map. (sel1 :#div-map-canvas) (map-config-obj))
  (log window/google.maps.DirectionsService)
  (dommy/listen! (sel1 :#button-submit) :click get-routes)
  )

(set! (.-onload js/window) init)

