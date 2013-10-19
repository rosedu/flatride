(ns flatride.utils)

(defn log [stuff]
  (.log js/console stuff))

(defn slope-diff [seq]
    (- (:altitude (last seq)) (:altitude (first seq))))

(defn toRad [deg]
  (/ (* deg Math/PI) 180))

(defn gps-distance [from to]
  (let [R 6371
        dLat (- (:lat to) (:lat from))
        dLon (- (:lng to) (:lng from))
        lat1 (toRad (:lat from))
        lat2 (toRad (:lat to))
        a (+ (* (Math/sin (/ dLat 2))
                (Math/sin (/ dLat 2))
              )
             (*
                (Math/sin (/ dLon 2))
                (Math/sin (/ dLon 2))
                (Math/cos lat1)
                (Math/cos lat2)
              ))
        c (* 2
             (Math/atan2 (Math/sqrt a) (Math/sqrt (- 1 a))))
        ]
    (* R c)))
