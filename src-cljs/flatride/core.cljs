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

(defn compute-routes [from to]
  (let [req-obj (directions-config-obj from to)]
    (log req-obj)
    (.route (window/google.maps.DirectionsService.) req-obj log)
    ))

