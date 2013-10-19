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

(defn start-compute-routes [from to display-fn]
  (let [req-obj (directions-config-obj from to)
        ds (window/google.maps.DirectionsService.)]
    (.route ds req-obj (partial process-routes display-fn))))

(defn increasing-seqs [coll]
  "Vector of subvectors of coll that are increasing"
  (reductions
    (fn [current-seq next-elem]
      (if (>= next-elem (last current-seq))
        (conj current-seq next-elem)
        [next-elem]))
    [(first coll)]
    (rest coll)))

(defn longest-seq [seqs]
  "Longest seq within seqs"
  (reduce #(if (>= (count %1) (count %2)) %1 %2) [] seqs))

(defn greatest-sum-seq [seqs]
  "Highest sum seq within seqs"
  (apply max-key #(reduce + %) seqs))

(defn process-elevation-data [elevations status]
  (log elevations)
  )

(defn start-compute-elevation-data [route]
  (let [es (window/google.maps.ElevationService.)
        path-req (js-obj "path" route "samples" 200)]
    (.getElevationAlongPath path-req process-elevation-data)))

(defn parse-route [route]
  ;; route.legs[0].distance // .duration
  (let [route-info (nth (.-legs route) 0)]
    {
     :distance (->> route-info .-distance .-text)
     :duration (->> route-info .-duration .-text)
     }))

(defn process-routes [display-fn routes status]
  ; when no bike available fall back to car TODO
  (display-fn {
               :to-display routes
               :routes-data (map parse-route (.-routes routes))}))

