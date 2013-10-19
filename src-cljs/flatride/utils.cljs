(ns flatride.utils)

(defn log [stuff]
  (.log js/console stuff))

(defn slope-diff [seq]
    (- (last seq) (first seq)))

