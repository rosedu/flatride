(ns flatride.frontend
    (:use-macros
        [dommy.macros :only [node sel sel1]])
    (:require
        [dommy.core :as dommy]
        [flatride.core :as core]))

(def gmaps nil)

(defn map-config-obj []
  (js-obj "zoom" 12
                "mapTypeId" gmaps.MapTypeId.ROADMAP
                "center" (gmaps.LatLng. 45 45)))

(defn init []
  (set! gmaps window/google.maps)
  (gmaps.Map. (sel1 :#div-map-canvas) (map-config-obj)))

(set! (.-onload js/window) init)

