(ns flatride.frontend
    (:use-macros
        [dommy.macros :only [node sel sel1]])
    (:require
        [dommy.core :as dommy]
        [flatride.core :as core]))

(defn map-config-obj []
  (js-obj "zoom" 12
                "mapTypeId" window/google.maps.MapTypeId.ROADMAP
                "center" (window/google.maps.LatLng. 45 45))) 

(defn init []
  (window/google.maps.Map. (sel1 :#div-map-canvas) (map-config-obj)))

(set! (.-onload js/window) init)
