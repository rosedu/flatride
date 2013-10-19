(ns flatride.frontend
    (:use-macros
        [dommy.macros :only [node sel sel1]])
    (:require
        [dommy.core :as dommy]
        [flatride.core :as core]))

(dommy/append! (sel1 :body) (node [:p "Helloes"]))


