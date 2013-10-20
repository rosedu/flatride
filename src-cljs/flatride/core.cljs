(ns flatride.core
  (:use-macros
    [dommy.macros :only [node sel sel1]])
  (:use [flatride.utils :only [log]])
  (:require
    [dommy.core :as dommy]))


(defn directions-config-obj [from to mode]
  (let [cfg-obj (js-obj "origin" from
                        "destination" to
                        "provideRouteAlternatives" true)]
    (if (= :drive mode)
      (set! (.-travelMode cfg-obj) window/google.maps.DirectionsTravelMode.DRIVING)
      (set! (.-travelMode cfg-obj) window/google.maps.DirectionsTravelMode.BICYCLING))
    cfg-obj))

(def *compute-routes-args* nil)

(defn start-compute-routes [from to display-route-fn display-elev-fn mode]
  (set! *compute-routes-args* [from to display-route-fn display-elev-fn])
  (let [req-obj (directions-config-obj from to mode)
        ds (window/google.maps.DirectionsService.)]
    (.route ds req-obj (partial process-routes display-route-fn display-elev-fn))))

(defn increasing-seqs [coll]
  "Vector of subvectors of coll that are increasing"
  (filter #(> (count %) 1)
          (reductions
            (fn [current-seq next-elem]
              (if (>= (:altitude next-elem) (:altitude (last current-seq)))
                (conj current-seq next-elem)
                [next-elem]))
            [(first coll)]
            (rest coll))))

(defn longest-seq [seqs]
  "Longest seq within seqs"
  (reduce #(if (>= (count %1) (count %2)) %1 %2) [] seqs))

(defn greatest-diff-seq [seqs]
  "Highest sum seq within seqs"
  (apply max-key #(- (:altitude (last %)) (:altitude (first %))) seqs))

(defn process-elevation-data [display-elev-fn idx elevation-data status]
  (let [elevations (map #(.-elevation %) elevation-data)
        coordinates (map #(.-location %) elevation-data)
        elev-objs (for [idx (range (count elevations))]
                    {:altitude (nth elevations idx)
                     :coordinates {:lat (.lat (nth coordinates idx))
                                   :lng (.lng (nth coordinates idx))}})
        slopes (increasing-seqs elev-objs)
        longest-slope (longest-seq slopes)
        steepest-slope (greatest-diff-seq slopes)]
    (display-elev-fn {:idx idx
                      :longest-slope longest-slope
                      :steepest-slope steepest-slope})))

(defn start-compute-elevation-data [route idx display-elev-fn]
  (let [es (window/google.maps.ElevationService.)
        path-req (js-obj "path" (.-overview_path route) "samples" 300)]
    (.getElevationAlongPath es
                            path-req
                            (partial process-elevation-data display-elev-fn idx))))

(defn parse-route [route]
  (let [route-info (nth (.-legs route) 0)]
    {:distance (->> route-info .-distance .-text)
     :duration (->> route-info .-duration .-text)
     :summary (.-summary route)}))

(defn process-routes [display-route-fn display-elev-fn routes status]
  (let [num-routes (->> routes .-routes .-length)]
    (if (= num-routes 0)
      (apply start-compute-routes (conj *compute-routes-args* :drive))
      (do
        (doseq [idx (range (->> routes .-routes .-length))]
          (start-compute-elevation-data (nth (.-routes routes) idx) idx display-elev-fn))
        (display-route-fn {:to-display routes
                           :routes-data (map parse-route (.-routes routes))})))))

