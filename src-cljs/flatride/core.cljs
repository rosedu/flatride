(ns flatride.core
  (:use-macros
    [dommy.macros :only [node sel sel1]])
  (:use [flatride.utils :only [log]])
  (:require
    [dommy.core :as dommy]))

(defn directions-config-obj [from to]
  (js-obj "origin" from
          "destination" to
          "travelMode" window/google.maps.DirectionsTravelMode.WALKING))

(defn start-compute-routes [from to display-fn]
  (let [req-obj (directions-config-obj from to)]
    (.route (window/google.maps.DirectionsService.)
            req-obj
            (partial process-routes display-fn))))

(defn process-routes [display-fn routes status]
  ; when no bike available fall back to car TODO
  (log routes)
  (display-fn {}))

