(ns flatride.core
  (:use-macros
    [dommy.macros :only [node sel sel1]])
  (:use [flatride.utils :only [log]])
  (:require
    [dommy.core :as dommy]))

(defn directions-config-obj [from to]
  (js-obj "origin" from
          "destination" to
          "provideRouteAlternatives" true
          "travelMode" window/google.maps.DirectionsTravelMode.DRIVING))

(defn parse-route [route]
  ;; route.legs[0].distance // .duration
  (let [route-info (nth (.-legs route) 0)]
    {
      :distance (->> route-info .-distance .-text)
      :duration (->> route-info .-duration .-text)
      :path-obj route
    }))

(defn start-compute-routes [from to display-fn]
  (let [req-obj (directions-config-obj from to)]
    (.route (window/google.maps.DirectionsService.)
            req-obj
            (partial process-routes display-fn))))

(defn process-routes [display-fn routes status]
  ; when no bike available fall back to car TODO
  (display-fn routes))

