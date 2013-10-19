(ns flatride.utils)

(defn log [stuff]
  (.log js/console stuff))

(defn slope-diff [seq]
    (- (:altitude (last seq)) (:altitude (first seq))))

